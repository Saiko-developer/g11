# Admin dashboard UI

The existing protected `/admin` route now presents an academy overview, a searchable account directory and separate workspaces for payments, AI connection tests, teacher/scholarship requests, support and announcements. Desktop has a fixed-width sidebar; small screens have horizontally scrollable navigation and account cards, with no page-wide horizontal overflow.

The route still uses the existing AuthGate and server functions. No production authentication bypass or preview route was added. No database, provider, Grade 10, quota or payment-approval logic changed.

## What the UI shows

- Overview counts and account-status bars use the accounts returned by the existing server query. Active means account status, not current online presence. Exam counts mean generated papers, not markings.
- Directory search, filters and ten-row pagination operate on the loaded list; this does not introduce server pagination or remove existing backend row limits.
- Account dialogs preserve existing credit, scholarship, role, status, deletion and progress actions. Credit inputs accept positive whole numbers and confirmation is required before mutations. Errors stay inside the form. UI protections for self/main-admin account actions remain; server authorization remains authoritative.
- Panels mount on first visit and stay mounted while switching workspaces, retaining unsaved payment/support drafts. Navigation away from the entire admin page still ends that state.
- Refresh reloads the account/reported-usage query. Existing panels keep their existing fetch/approval lifecycle.
- Provider billing links open Lovable. No provider balance, paid subscriber count, revenue, speaking minutes or cost is fabricated. AI testing is explicitly described as an on-demand model call that can consume credits.

## Verification

Unit tests cover actual/unknown counts, panel navigation, search/filter/pagination, validated allowance confirmation, failed mutation recovery, self/main-admin action visibility, scholarship decisions and draft retention. TypeScript and targeted ESLint check the new components and route.

Chromium screenshots and interaction checks use a temporary browser-only fixture with synthetic accounts and mocked actions. They cover desktop, 390px mobile, the account/credit dialogs and navigation. Both document and body width were 390px on mobile, and there were no page errors. The real signed-out `/admin` route still displays Admin Login. Temporary preview files were removed and are not part of the commit. No real account mutations, paid AI calls or production build were performed. Signed-in production admin flows remain to be checked using a real admin session.

## Backend work remains separate

This UI does not implement the proposed daily speaking rule, monthly subscriptions, provider metering, budget pause/resume or audited plan activation. Previously identified scholarship preservation, suspended-user API enforcement, main-admin consistency and authoritative balance concerns are not fixed by styling. See the AI usage audit and the local admin review for the planned follow-up.
