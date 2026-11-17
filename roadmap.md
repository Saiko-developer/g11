# Grade 11 mock-exam repair
- [x] Prevent poem quotation and MCQ label formatting errors without weakening textbook validation.
- [x] Run 33 regression tests; preview build passes; no production deployment.
- [ ] Verify a newly generated full paper in the signed-in preview — blocked: requesting account has used its 2 daily exams; verified the real 429 allowance response without altering quotas.

# Uploaded-paper AI marking
- [x] Read uploaded PDF, Word and image question papers with student answer photos.
- [x] Add optional private marking guide and render question files in the exam room.
- [x] Protect draft generation against duplicates and show marking failures to teachers.
- [ ] Verify marking and student/teacher flows live — blocked: no account has signed in yet.

# Setup
- [x] Enable Google sign-up/sign-in, restore automatic profile creation, and test session restoration, admin redirects and sign-out.
- [ ] Verify first Google signup and profile/role creation live — blocked: no account has signed up yet.
- [ ] Admin first sign-in check — blocked: admin must sign in with Google once.
- [ ] Save KBZPay/WavePay details and prices — blocked: admin enters them on the Top-up page.

# Classroom availability
- [x] Install the missing reading-classroom schema without changing AI quotas or enabling paid narration.
- [x] Add regression coverage and verify Grade 10 and Grade 11 public classroom loading.
- [ ] Verify signed-in classroom progress live — blocked: requesting user has no matching auth account; sign in through preview.

# Study Plan availability
- [x] Apply missing daily-study storage and verify authenticated read access.
- [x] Add regression coverage for plan reads and enrollment saves (16 tests passed).
- [ ] Verify Study Plan live while signed in — blocked: requesting user has no matching auth account; sign in through preview.

# Daily classroom narration activation
- [x] Apply narration/credit migration 0005 through the runner; reconcile storage in 0006 and least-privilege grants in 0007.
- [x] Verify RLS, service-role-only mutation RPCs, private 8 MB storage and configured server providers without exposing secrets.
- [x] Match all four Day 1 English scripts to canonical textbook data; record Burmese narration as AI-assisted with sampled STT verification, not human teacher certification.
- [x] Generate 16 real Grade 10 Unit 1 Day 1 clips (5,822,880 bytes) within the 20-clip cap; decode every WAV and confirm repeat cache hits.
- [ ] Owner publication and bounded Ask Teacher activation — blocked: no auth account matches the requesting user; sign up/sign in with Google, listen to the clips and approve publication.
- [ ] Verify signed-in Start Class narration order, pause/repeat/question/reserve/refund/resume — blocked by the same owner authentication/approval requirement; live questions remain disabled.
- [x] No production deployment.
