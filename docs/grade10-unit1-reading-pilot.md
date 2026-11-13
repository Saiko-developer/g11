# Grade 10 Unit 1 Reading: on-demand audio pilot

This supersedes the manual audio-activation instructions in `grade10-unit1-teacher-v2.md`. The teaching script itself, lesson version and separate progress history are unchanged.

## What to try

1. An existing SQL-verified admin opens `/teaching-setup`.
2. Grade 10 → Unit 1 → Reading is the only enabled pilot. Other skills/units/Grade 11 are labelled pending in this setup UI; their existing student textbook routes are unchanged.
3. Read the complete teacher script, acknowledge platform audio-generation costs, and click **Reading အတန်း ဖွင့်မယ်**. This approves the exact manifest hash; it does not generate audio or invoke a model.
4. Follow **ကျောင်းသားလို အတန်းစမ်းမယ်** to `/class?start=true`. Existing enrollment determines the grade; use an account enrolled in Grade 10. The first listener can wait while an uncached clip is prepared. Later listeners reuse that clip.

Student-facing classroom routes no longer contain admin approval, preparation, or generate buttons, even when viewed by an admin. All setup is restricted to the authenticated admin endpoint and page.

## Server behavior and limits

Only `g10-u1-reading`, `teacher-v2`, `myanmar-teacher-v2` can generate on a cache miss. Active authentication and exact script publication are checked before entering the generation path. Client-provided scripts are never sent to TTS; the server resolves the canonical cursor.

- **Ready:** serve the private cached WAV; no generation.
- **Missing:** call the existing service-only `claim_classroom_audio` RPC. Its global advisory lock and unique hash allow one winner to generate.
- **Preparing:** return HTTP 202; the browser polls every two seconds with a two-minute deadline. Pause/navigation cancels browser waiting. Other listeners do not duplicate the winner's generation.
- **Provider unavailable:** do not claim a new clip when the server key is missing. Classroom narration accepts only Gemini; it never spends on an OpenAI fallback that would be rejected. Other speech callers retain their existing fallback.
- **Failed:** stop and report review needed; never retry paid generation automatically.
- **No daily clip quota:** migration 0008 removes the former 20-claim calendar limit. A full Reading passage can claim all 64 clips on the same day. The unique narration hash still allows only one generation owner per clip. Failed clips are not retried automatically.
- **Database/storage unavailable:** fail closed. Database errors do not trigger generation; an unreadable existing ready object does not trigger a replacement charge.

The shared narration does not debit a student's AI credits. Existing live questions still use their own allowance and existing live setting; this rollout does not enable live AI globally. No auto-prefetch is included in this first trial: only the requested playback clip is generated. The provider's existing server credentials and private storage must be configured.

Removing the former clip quota requires migration 0008 (a function-only change; no tables, data, auth or policies are replaced). No paid generation, Lovable AI builder run or production deployment is needed to test this change. Admin approval at runtime writes the existing publication record; actual playback writes cache records/files and can incur provider costs. Git push alone cannot approve the script or certify live audio quality.

## Verification and operational limits

Tests cover admin-only exact-hash approval without generation, the grade/unit boundary, cache miss → generation → private response, duplicate listeners, pending polling and Pause, failed claims, more than 20 same-day claims, duplicate-claim denial, database failure, Grade 11's read-only audio path, no shared-credit debit and the simplified setup UI. Existing local SQL tests check service-only claims, quotas, RLS and versioned progress.

There is no durable background worker or automatic lease recovery in this pilot. A worker crash can leave a claim preparing. The browser eventually stops waiting; an operator must inspect failed/stale claims before a deliberate recovery. This prevents automatic repeat charges but is a limitation of the beta. No real provider generation or audio-listening test was performed from the Codex workspace.
