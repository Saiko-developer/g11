# VoxCPM2 Local in Audio Manager

Use this workflow for fixed Grade 10 and 11 narration in the Audio Manager catalog. You can prepare local audio privately before classroom publication. Student access still follows the lesson’s existing Teaching Setup publication rules. The catalog includes the current authored Reading, Grammar, and Writing clips. Live tutor and speaking audio use their existing workflows.

## Setup after approval

1. Apply Drizzle migration `0022_voxcpm2_local_audio` to a separate test project through the approved migration workflow, then deploy this branch to that test project.
2. Generate a dedicated secret with `openssl rand -hex 32` and save it as `AUDIO_LOCAL_WORKER_SECRET` in the test server's secrets. Keep it separate from the Gemini, Supabase, and cloud queue credentials. The Audio Manager shows the new provider once this secret is configured.
3. Save [the companion script](../scripts/voxcpm2-companion.py) to your Mac. Use the exact folder that already ran `benchmark.py`.

```sh
# Paste the matching secret at the hidden prompt.
read -rs AUDIO_LOCAL_WORKER_SECRET
export AUDIO_LOCAL_WORKER_SECRET
python3 voxcpm2-companion.py \
  --origin https://your-test-academy.example \
  --kit ~/Downloads/voxcpm2-phase1 \
  --once
unset AUDIO_LOCAL_WORKER_SECRET
```

Use the test academy's HTTPS origin. The companion refuses redirects and uses only outbound HTTPS. It uses the existing CLI and the Q8_0 BaseLM and F16 Acoustic GGUF files in your kit. Defaults are CPU mode, six diffusion steps, and 600 seconds per part. Remove `--once` for a batch and keep the Terminal process open. Press Ctrl+C to stop it.

## Queue and approve

1. Open **Admin → Audio Manager**, register the current catalog if needed, and select **VoxCPM2 Local** under **Voice provider**.
2. Use **Generate selected** or **Prepare missing audio**. Use **Regenerate selected** if an approved version already exists. Start the companion to process the local queue. The progress indicator reports job stages. Gemini jobs continue through **Process Unit Queue** under the Gemini selection.
3. Open **Review** when the job finishes. Preview the full MP3, then approve it if it matches the teaching script. The existing approved pointer switches only at approval. Version History, Download MP3, and ZIP backup and restore use the existing library workflows.

If a local job fails, check the Mac Terminal and the Audio Manager error. **Resume stored audio** checks the private WAV saved during the previous upload. **Retry failed audio** allows the Mac to render again if that WAV is unavailable. An expired lease requires an explicit resume or retry. For pronunciation and voice continuity, listen across adjacent clips and the joins in longer clips.

## Implementation and verification

The companion verifies the exact UTF-8 transcript checksum, sends the existing Phase 1 voice description as a model control, and splits long input at source sentence or phrase boundaries. It checks and joins mono PCM16 segments. The server encodes them to MP3 using the existing codec and saves the original WAV for recovery. Storage paths are immutable, with each upload fenced by its job lease. Local usage records are separate from cloud TTS attempt and cost records.

Run the SQL test with disposable PGlite and the companion test against the Phase 1 transcript manifest:

```sh
node scripts/verify-audio-migration.mjs /path/to/pglite-test-tools/package.json
PYTHONDONTWRITEBYTECODE=1 python3 scripts/verify-voxcpm2-companion.py /path/to/voxcpm2-phase1/clips.json
VOXCPM_TEST_WAV_DIR=/path/to/phase1-wavs npm test -- src/lib/permanent-audio src/components/admin/AudioManager.test.tsx
```

For the first connected pilot, queue one replacement in a test backend and check **Queued → Generating → Review**. Listen to it and verify the previously approved audio before approving the replacement. After approval, check signed-in playback, individual MP3 download, ZIP export and restore into another test project. Verify that the local job produces zero cloud TTS attempt records. Repeat for a long clip and one published Grade 10 classroom clip.
