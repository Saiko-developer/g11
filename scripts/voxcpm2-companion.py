#!/usr/bin/env python3
"""Pull fixed audio jobs over HTTPS and render with an existing Phase 1 kit."""

import argparse
from contextlib import suppress
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
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
CONTROL_TIMEOUT = 25
UPLOAD_TIMEOUT = 150
SENTENCE_END = re.compile(r"[။!?](?:\s*)|\.(?=\s|[\u1000-\u109f]|$)\s*|\n+")
PHRASE_END = re.compile(r"[၊,;:]\s*|\s+")

VERB_FORM = r"V(?:[123]|[-‑–]?(?i:ing))"
VERB_FORMS = {
    "V1": "Verb Form One",
    "V2": "Verb Form Two",
    "V3": "Verb Form Three",
}
FORM_RUN = (
    rf"{VERB_FORM}(?:[ \t]*(?:/|→|->)[ \t]*{VERB_FORM})+"
    rf"|V1[-–]V2[-–]V3|{VERB_FORM}"
)
NOTATION = re.compile(rf"(?<![A-Za-z0-9_./+-])(?:{FORM_RUN})(?![A-Za-z0-9_/+-]|\.[A-Za-z0-9_])")
PROTECTED_TEXT = re.compile(
    r'''(?i:https?|ftp)://[^\s<>"“”`]+|\bwww\.[^\s<>"“”`]+'''
    r'''|\b[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+/[^\s<>"“”`]+'''
    r"|\b[A-Za-z0-9_.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    r'''|`+[^`\n]+`+|"[^"]*"|“[^”]*”|‘[^\n]*?’(?![A-Za-z0-9])'''
    r"""|(?<![A-Za-z0-9])'[^\n]*?'(?![A-Za-z0-9])"""
    r"|\b[A-Za-z_]\w*\([A-Za-z0-9_., +*/=^×÷−<>≤≥-]+\)"
)
# Tight allowlists keep arithmetic, identifiers and unfamiliar punctuation intact.
FORMULA = re.compile(
    r"(?P<cue>\b(?:grammar formula|sentence (?:structure|pattern)|word order|"
    r"grammar pattern)|ဝါကျ(?:ဖွဲ့စည်း|တည်ဆောက်)ပုံ|ပုံစံကို ဘုတ်မှာ ဒီလို မှတ်ထားမယ်)"
    r"(?P<pause>[ \t]*(?:[:：]|[—–])[ \t]*)"
    r"S[ \t]*\+[ \t]*V[ \t]*\+[ \t]*O(?![A-Za-z0-9_]|[ \t]*[+=*/^×÷−-])",
    re.IGNORECASE,
)
ATOM = rf"(?:{VERB_FORM}|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*|\d+(?:\.\d+)?)"
EXPRESSION = re.compile(
    rf"(?<![A-Za-z0-9_.])\(?{ATOM}\)?"
    rf"(?:[ \t]*(?:->|[→+*/=^×÷−<>≤≥-])[ \t]*\(?{ATOM}\)?)+"
    rf"(?![A-Za-z0-9_]|\.[A-Za-z0-9_])"
)
ANNOTATION = re.compile(
    rf"(?<![A-Za-z0-9_])\((?P<label>{FORM_RUN}|(?i:combine (?:the )?sentences|"
    r"sentence combining|(?:present|past) participle(?: phrase)?|prepositional phrase|"
    r"(?:present|past) (?:simple|continuous|perfect)|"
    r"base form|subject|verb|object|adjective|noun|pronoun|reported speech|passive voice)|"
    r"[က-အ][က-ဿ ၊။\t]*)\)",
)


def spoken_verb_form(form):
    return VERB_FORMS.get(form, "Verb plus I N G")


def speak_notation(match):
    notation = match[0]
    if notation in ("V1-V2-V3", "V1–V2–V3"):
        return "Verb Form One, Verb Form Two, and Verb Form Three"
    groups = re.split(r"[ \t]*(?:→|->)[ \t]*", notation)
    return " changes to ".join(
        spoken_alternatives(group) if "/" in group else spoken_verb_form(group)
        for group in groups
    )


def spoken_alternatives(notation):
    forms = re.split(r"[ \t]*/[ \t]*", notation)
    spoken = [spoken_verb_form(form) for form in forms]
    if forms == ["V1", "V2", "V3"]:
        return ", ".join(spoken[:-1]) + ", and " + spoken[-1]
    if len(spoken) == 2:
        return " or ".join(spoken)
    return ", ".join(spoken[:-1]) + ", or " + spoken[-1]


ENGLISH_PHRASE = re.compile(r"[A-Za-z][A-Za-z0-9'’ -]*(?:[.!?])?")
ENGLISH_LABEL = re.compile(r"\(([A-Za-z][A-Za-z0-9'’ -]*)\)")
ENGLISH_RUN = re.compile(r"\b[A-Za-z][A-Za-z0-9'’-]*(?:[ \t]+[A-Za-z][A-Za-z0-9'’-]*)+")
SPOKEN_PUNCTUATION = re.compile(
    r"(?P<stop>[!?။]+|(?<![A-Za-z0-9])\.|\.(?![A-Za-z0-9]))"
    r"|[၊()“”\"]|(?<!\d),|,(?!\d)"
)


def normalize_for_voxcpm2(text, *, pause_english=False):
    """Expand confirmed teaching notation outside literal quotations and expressions."""
    def annotation(match):
        prefix = match.string[:match.start()]
        if prefix.count("(") > prefix.count(")"):
            # Leave nested grouping intact, including annotations inside it.
            return match[0]
        if pause_english and ENGLISH_PHRASE.fullmatch(match["label"]):
            return f"\n{match['label']}\n"
        # Keep adjacent Burmese text separated when taking away a delimiter.
        before = "" if not prefix or prefix[-1].isspace() else " "
        following = match.string[match.end():match.end() + 1]
        after = " " if following and following.isalnum() else ""
        return before + match["label"] + after

    def prose(fragment):
        return NOTATION.sub(speak_notation, ANNOTATION.sub(annotation, fragment))

    def narration(part):
        part = FORMULA.sub(r"\g<cue>\g<pause>Subject plus Verb plus Object", part)
        result = []
        start = 0
        for expression in EXPRESSION.finditer(part):
            result.append(prose(part[start:expression.start()]))
            literal = expression[0]
            if ANNOTATION.fullmatch(literal) or NOTATION.fullmatch(literal):
                literal = prose(literal)
            result.append(literal)
            start = expression.end()
        result.append(prose(part[start:]))
        return "".join(result)

    result = []
    start = 0
    for literal in PROTECTED_TEXT.finditer(text):
        result.extend((narration(text[start:literal.start()]), literal[0]))
        start = literal.end()
    result.append(narration(text[start:]))
    return "".join(result)


def synthesis_transcript(text):
    """Turn display punctuation into pauses while keeping the narrated words in order."""
    mixed = bool(re.search(r"[\u1000-\u109f]", text) and re.search(r"[A-Za-z]", text))
    text = normalize_for_voxcpm2(text, pause_english=mixed)

    def pause_around(phrase):
        return f"\n{phrase}\n" if mixed else f" {phrase} "

    def strip_punctuation(prose):
        prose = ENGLISH_LABEL.sub(lambda match: pause_around(match[1]), prose)
        prose = SPOKEN_PUNCTUATION.sub(lambda match: "\n" if match["stop"] else " ", prose)
        return ENGLISH_RUN.sub(lambda match: pause_around(match[0]), prose) if mixed else prose

    def prose_with_expressions(prose):
        output = []
        start = 0
        for expression in EXPRESSION.finditer(prose):
            if not re.search(r"[+=*/^×÷−<>≤≥]", expression[0]):
                continue
            output.extend((strip_punctuation(prose[start:expression.start()]), expression[0]))
            start = expression.end()
        output.append(strip_punctuation(prose[start:]))
        return "".join(output)

    output = []
    start = 0
    for literal in PROTECTED_TEXT.finditer(text):
        output.append(prose_with_expressions(text[start:literal.start()]))
        quoted = literal[0][0] in "\"“‘'"
        if quoted:
            words = literal[0][1:-1]
            spoken = prose_with_expressions(words)
            output.append(pause_around(spoken) if ENGLISH_PHRASE.fullmatch(words) else f" {spoken} ")
        else:
            output.append(literal[0])
        start = literal.end()
    output.append(prose_with_expressions(text[start:]))
    return "\n".join(line for line in (" ".join(line.split()) for line in "".join(output).splitlines()) if line)


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
                with self.client.open(req, timeout=UPLOAD_TIMEOUT if wav is not None else CONTROL_TIMEOUT) as response:
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


def save_upload_recovery(output, recovery):
    recovery.parent.mkdir(mode=0o700, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=recovery.parent, delete=False) as pending:
        temporary = Path(pending.name)
        try:
            with output.open("rb") as source:
                shutil.copyfileobj(source, pending)
            pending.close()
            temporary.replace(recovery)
        finally:
            temporary.unlink(missing_ok=True)


def process_job(args, kit, exchange, job):
    reason = "script"
    try:
        text = job["text"]
        if hashlib.sha256(text.encode("utf-8")).hexdigest() != job["sha256"]:
            raise ValueError("Fixed transcript checksum did not match")
        narration = synthesis_transcript(text)
        parts = list(split_transcript(narration))
        if not parts:
            raise ValueError("Fixed transcript is empty")
        identity = json.dumps([job["id"], job["sha256"], narration, VOICE, args.timesteps])
        recovery = kit / "upload-recovery" / f"{hashlib.sha256(identity.encode()).hexdigest()}.wav"
        if recovery.is_file():
            reason = "upload"
            print(f"Retrying upload of saved WAV: {recovery}", flush=True)
            exchange.request(wav=recovery.read_bytes(), job=job)
            with suppress(OSError):
                recovery.unlink()
            print("MP3 ready for review in Audio Manager.", flush=True)
            return True
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
            try:
                exchange.request(wav=output.read_bytes(), job=job)
            except (RuntimeError, ValueError):
                try:
                    save_upload_recovery(output, recovery)
                    print(f"Upload failed. WAV kept for Retry failed audio: {recovery}", file=sys.stderr)
                except OSError as recovery_error:
                    print(f"Could not keep the WAV for upload retry: {recovery_error}", file=sys.stderr)
                raise
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
