"""Exercise exact transcript splitting and the companion with an offline renderer fixture."""

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import wave

spec = importlib.util.spec_from_file_location("companion", Path(__file__).with_name("voxcpm2-companion.py"))
companion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(companion)
MANIFEST = json.loads(Path(sys.argv.pop(1)).read_text(encoding="utf-8"))


class FakeExchange:
    def __init__(self):
        self.events = []

    def request(self, action=None, **kwargs):
        self.events.append((action, kwargs))
        return {"state": "pending"}


class CompanionTest(unittest.TestCase):
    def test_three_existing_scripts_and_wav_join(self):
        for clip in MANIFEST["clips"]:
            with self.subTest(clip=clip["id"]):
                exchange = FakeExchange()
                rendered = []

                def render(_args, _kit, transcript, path, beat):
                    rendered.append(transcript)
                    beat()
                    with wave.open(str(path), "wb") as wav:
                        wav.setparams((1, 2, 48000, 0, "NONE", "not compressed"))
                        wav.writeframes(b"\x10\x00" * 48)

                job = {"id": "job", "token": "lease", "text": clip["text"], "sha256": clip["sha256"]}
                args = types.SimpleNamespace(timeout=600, timesteps=6)
                with patch.object(companion, "render_part", render):
                    self.assertTrue(companion.process_job(args, Path("/unused"), exchange, job))
                self.assertEqual("".join(rendered), clip["text"])
                self.assertTrue(all(len(part.encode()) <= companion.PART_BYTES for part in rendered))
                self.assertEqual(len(rendered) > 1, clip["id"] == "long-explanation")
                body = exchange.events[-1][1]["wav"]
                with tempfile.TemporaryFile() as file:
                    file.write(body)
                    file.seek(0)
                    with wave.open(file, "rb") as wav:
                        self.assertEqual(wav.getnframes(), 48 * len(rendered))

    def test_checksum_and_timeout_report_failure(self):
        args = types.SimpleNamespace(timeout=600, timesteps=6)
        job = {"id": "job", "token": "lease", "text": "sample", "sha256": "wrong"}
        exchange = FakeExchange()
        self.assertFalse(companion.process_job(args, Path("/unused"), exchange, job))
        self.assertEqual(exchange.events[-1][1]["reason"], "script")
        job["sha256"] = hashlib.sha256(b"sample").hexdigest()
        with patch.object(companion, "render_part", side_effect=TimeoutError("test timeout")):
            self.assertFalse(companion.process_job(args, Path("/unused"), exchange, job))
        self.assertEqual(exchange.events[-1][1]["reason"], "timeout")


    def test_runner_subprocess_uses_installed_kit_and_cpu_defaults(self):
        args = types.SimpleNamespace(timeout=600, timesteps=6)
        with tempfile.TemporaryDirectory() as tmp:
            kit = Path(tmp)
            engine = kit / "runtime/build/bin/voxcpm2-cli"
            engine.parent.mkdir(parents=True)
            engine.write_text("""#!/usr/bin/env python3
import sys, wave
argv = sys.argv[1:]
assert '--cpu' in argv and argv[argv.index('--timesteps') + 1] == '6'
assert argv[argv.index('--text') + 1].endswith('Original fixed text.')
assert argv[-2].endswith('/models/VoxCPM2-BaseLM-Q8_0.gguf')
assert argv[-1].endswith('/models/VoxCPM2-Acoustic-F16.gguf')
with wave.open(argv[argv.index('--output') + 1], 'wb') as output:
    output.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
    output.writeframes(b'\\x10\\x00' * 48)
""")
            engine.chmod(0o700)
            out = kit / "part.wav"
            companion.render_part(args, kit, "Original fixed text.", out, lambda: None)
            with wave.open(str(out), "rb") as wav:
                self.assertEqual(wav.getnframes(), 48)

    def test_origin_validation(self):
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            companion.Exchange("http://localhost:1234", "token")
        with self.assertRaisesRegex(ValueError, "origin"):
            companion.Exchange("https://user:pass@example.org", "token")
        self.assertTrue(companion.Exchange("https://example.org", "token").url.endswith("?engine=voxcpm2"))


if __name__ == "__main__":
    unittest.main()
