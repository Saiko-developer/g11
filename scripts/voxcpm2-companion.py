#!/usr/bin/env python3
"""Pull fixed audio jobs over HTTPS and render with an existing Phase 1 kit."""

import argparse
from contextlib import suppress
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import wave

VOICE = (
    "A warm, natural Burmese male teacher voice, around 30 years old, calm, friendly, "
    "clear pronunciation, moderate speaking speed, professional but engaging classroom teaching style."
)
# The pinned CLI prefills at most 1024 tokens. Leave room for the voice prompt and audio-start token.
PART_BYTES = 800
MAX_PCM_BYTES = 32 * 1024 * 1024 - 44
SENTENCE_END = re.compile(r"[။!?](?:\s*)|\.(?=\s|[\u1000-\u109f]|$)\s*|\n+")
PHRASE_END = re.compile(r"[၊,;:]\s*|\s+")


def split_transcript(text):
    """Keep source bytes and order, preferring a sentence boundary."""
    while len(text.encode("utf-8")) > PART_BYTES:
        for boundaries in (SENTENCE_END, PHRASE_END):
            end = 0
            for match in boundaries.finditer(text):
                if len(text[:match.end()].encode("utf-8")) > PART_BYTES:
                    break
                if text[:match.end()].strip():
                    end = match.end()
            if end:
                break
        if not end:
            raise ValueError("A phrase exceeds the runtime limit without a safe split boundary")
        yield text[:end]
        text = text[end:]
    if text:
        yield text


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Exchange:
    def __init__(self, origin, key):
        url = urllib.parse.urlsplit(origin)
        if url.scheme != "https" or not url.hostname or url.username or url.password or url.path not in ("", "/") or url.query or url.fragment:
            raise ValueError("Use the HTTPS academy origin without a path")
        self.url = f"{url.scheme}://{url.netloc}/api/audio-worker?engine=voxcpm2"
        self.key = key
        self.client = urllib.request.build_opener(NoRedirect)

    def request(self, action=None, *, job=None, progress=0, reason=None, wav=None):
        headers = {"Authorization": f"Bearer {self.key}"}
        if wav is None:
            body = {"action": action}
            if job:
                body.update(id=job["id"], token=job["token"])
            if action == "heartbeat":
                body["progress"] = progress
            if action == "fail":
                body["reason"] = reason
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        else:
            headers.update({"Content-Type": "audio/wav", "X-Audio-Job": job["id"], "X-Audio-Lease": job["token"]})
            data = wav
        for attempt in range(3):
            try:
                req = urllib.request.Request(self.url, data=data, headers=headers, method="POST")
                with self.client.open(req, timeout=25) as response:
                    return json.loads(response.read(64 * 1024))
            except urllib.error.HTTPError as error:
                with error:
                    detail = error.read(2048).decode(errors="replace")
                if error.code < 500 or attempt == 2 or action == "claim":
                    raise RuntimeError(f"HTTP {error.code}: {detail}") from error
            except (OSError, TimeoutError) as error:
                if attempt == 2 or action == "claim":
                    raise RuntimeError(f"Could not reach Audio Manager: {error}") from error
            time.sleep(2 ** attempt)


def stop_process(process):
    if process.poll() is None:
        with suppress(ProcessLookupError):
            process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            with suppress(ProcessLookupError):
                process.kill()
            process.wait()


def render_part(args, kit, text, path, beat):
    command = [
        str(kit / "runtime/build/bin/voxcpm2-cli"), "--cpu", "--text", f"({VOICE}){text}",
        "--seed", "42", "--steps", "1200", "--timesteps", str(args.timesteps), "--output", str(path),
        str(kit / "models/VoxCPM2-BaseLM-Q8_0.gguf"), str(kit / "models/VoxCPM2-Acoustic-F16.gguf"),
    ]
    with subprocess.Popen(command) as process:
        try:
            deadline = time.monotonic() + args.timeout
            while process.poll() is None:
                try:
                    process.wait(timeout=min(15, max(0.01, deadline - time.monotonic())))
                except subprocess.TimeoutExpired:
                    if time.monotonic() >= deadline:
                        raise TimeoutError("VoxCPM2 exceeded the per-part timeout")
                    beat()
            if process.returncode != 0:
                raise ValueError(f"VoxCPM2 exited with status {process.returncode}")
        finally:
            stop_process(process)


def join_wav(parts, output):
    total = 0
    with wave.open(str(output), "wb") as joined:
        for index, path in enumerate(parts):
            with wave.open(str(path), "rb") as source:
                if (source.getnchannels(), source.getsampwidth(), source.getframerate()) != (1, 2, 48000):
                    raise ValueError("Expected 48 kHz mono PCM16 from VoxCPM2")
                if index == 0:
                    joined.setparams((1, 2, 48000, 0, "NONE", "not compressed"))
                size = source.getnframes() * 2
                total += size
                if total > MAX_PCM_BYTES:
                    raise ValueError("WAV exceeds the Audio Manager upload limit")
                samples = source.readframes(source.getnframes())
                if not size or len(samples) != size or not any(samples):
                    raise ValueError("VoxCPM2 produced an empty, silent or truncated WAV")
                joined.writeframes(samples)


def process_job(args, kit, exchange, job):
    reason = "script"
    try:
        text = job["text"]
        if hashlib.sha256(text.encode("utf-8")).hexdigest() != job["sha256"]:
            raise ValueError("Fixed transcript checksum did not match")
        parts = list(split_transcript(text))
        if not parts:
            raise ValueError("Fixed transcript is empty")
        with tempfile.TemporaryDirectory(prefix="saya-owl-audio-") as tmp:
            directory = Path(tmp)
            paths = []
            reason = "render"
            for index, part in enumerate(parts):
                progress = 5 + 80 * index // len(parts)
                def heartbeat():
                    exchange.request("heartbeat", job=job, progress=progress)
                heartbeat()
                path = directory / f"part-{index}.wav"
                try:
                    render_part(args, kit, part, path, heartbeat)
                except TimeoutError:
                    reason = "timeout"
                    raise
                paths.append(path)
            output = directory / "joined.wav"
            join_wav(paths, output)
            reason = "upload"
            exchange.request(wav=output.read_bytes(), job=job)
        print("MP3 ready for review in Audio Manager.", flush=True)
        return True
    except (EOFError, ValueError, OSError, wave.Error, RuntimeError) as error:
        print(error, file=sys.stderr, flush=True)
        with suppress(RuntimeError):
            exchange.request("fail", job=job, reason=reason)
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", required=True)
    parser.add_argument("--kit", type=Path, required=True, help="Existing VoxCPM2 Phase 1 folder")
    parser.add_argument("--timesteps", type=int, choices=(6, 10), default=6)
    parser.add_argument("--timeout", type=int, default=600, help="Seconds per rendered part")
    parser.add_argument("--once", action="store_true", help="Claim at most one job")
    args = parser.parse_args()
    if args.timeout < 1:
        parser.error("--timeout must be positive")
    kit = args.kit.expanduser().resolve()
    for path in (
        kit / "runtime/build/bin/voxcpm2-cli",
        kit / "models/VoxCPM2-BaseLM-Q8_0.gguf",
        kit / "models/VoxCPM2-Acoustic-F16.gguf",
    ):
        if not path.is_file():
            parser.error(f"Existing kit file missing: {path}")
    key = os.environ.get("AUDIO_LOCAL_WORKER_SECRET", "").strip()
    if len(key) < 32:
        parser.error("Set AUDIO_LOCAL_WORKER_SECRET using the matching server secret")
    try:
        exchange = Exchange(args.origin, key)
        while True:
            job = exchange.request("claim")
            if job["state"] == "claimed":
                print(f"Processing {job['lesson']} · clip {job['order']}", flush=True)
                passed = process_job(args, kit, exchange, job)
                if args.once:
                    return 0 if passed else 1
            elif args.once:
                print(f"Queue: {job['state']}")
                return int(job["state"] == "failed")
            else:
                time.sleep(5 if job["state"] == "idle" else 1)
    except (RuntimeError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
