# Speaking asks for login after starting

The exact message `AI Role-Play သုံးရန် အရင် Login ဝင်ပါ။` occurs in `src/components/lesson/SpeakingPractice.tsx`. That legacy Grade 10 UI calls `/api/roleplay`, which maps any speaking RPC error to HTTP 401. A missing speaking migration can therefore look like a login failure on that flow even with a valid token.

Current Grade 11 UI `Grade11RolePlay` calls `/api/g11-roleplay`, passes its bearer explicitly, refreshes an auth-rejected token at most once, and opts into service-error reporting. Missing speaking RPCs return 503 on that flow, not 401. Grade 11 lesson URLs are `/grade-11/<unit>/speaking`; `/practice/<unit>/speaking` is Grade 10. An exact app URL is needed to establish whether a reported legacy message comes from a Grade 10 route, an old deployment, or another cached version. Do not change Grade 10 to conceal this distinction.

A separate verified code weakness existed in the Grade 11 auth-service guard: any upstream 403 was treated as a bad user token. Infrastructure/WAF responses such as `403 / error code: 1010` and incorrect project API keys cannot be fixed by student sign-in. The opt-in guard now reports those as service unavailable (503), while recognized bad-token/session codes still return 401. A banned account reports 403 without inviting repeated token refresh. Default Grade 10 behavior is unchanged. This improves error classification; it does not repair blocked backend networking or reconfigure OAuth/API keys.

Validation: 71 targeted tests cover roleplay UI, bearer refresh, authentication, speaking RPCs and server roleplay. TypeScript and targeted lint pass. Tests are mocked and do not prove the reported live failure has been resolved.

Live checks: verify the actual URL and request path/status; confirm migration `0002_restore_speaking_practice` is applied to the new backend; verify client/server backend alignment and new-project runtime secrets. No live student token, production logs or deployed app URL was available for this diagnosis. See `remix-backend-restoration.md` for migration verification. Do not ask users to paste tokens or secret keys in chat.
