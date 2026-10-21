# Local CTU preview prototype

**Later local implementation, 21 October:** [CTU_SAVED_IMPORT.md](CTU_SAVED_IMPORT.md) describes the new owner-scoped persistence stage and confirmation-free connection flow. Cloud saving remains disabled pending deployment approval. The original read-only prototype record below is historical; the identity checkbox has now been removed at Jandre's request.

21 October 2026. Optional investigation on `prototype/ctu-sync-20261021`, based on Main `946018d`. This is a read-only connection preview, not a released sync/import feature. Main and all team branches are unaffected.

## Run and connect

Use Node/npm versions from the root README. Run `npm ci` on a new checkout. The existing ignored `.env.cloud.local` must contain the approved public StudyFlow Firebase configuration plus `VITE_CTU_PROTOTYPE=true`. Do not put passwords or service-account credentials in it. This prototype deliberately requires an admitted cloud account; emulator/layout mode cannot collect private CTU data.

```powershell
npm run prototype:ctu
```

This builds the helper and isolated cloud bundle, then serves only `http://127.0.0.1:4173`. It opens `/ctu-sync`, which redirects through the existing account guard as needed. Normal `npm run dev` remains the emulator launcher and does not enable this feature. The cloud build is local output, not a Hosting deployment.

Load `extension-dist/ctu-sync` as an unpacked extension in the same browser used for CTU and StudyFlow. In Opera, the user opens `opera://extensions`, enables Developer mode, chooses Load unpacked and selects that folder. Extension installation is a browser/profile permission change and needs the user's approval. Browser automation explicitly refused that internal URL during this task; the user must complete this step manually. Do not attempt to work around that policy through another tool or browser surface.

Reload StudyFlow after loading the helper. Sign in with your own approved account and click **Connect and preview**. If needed, sign into the real CTU tab yourself. The helper creates its own CTU tab, waits up to 90 seconds for login, reads the supported pages and closes only the tab it created. It does not navigate or close your existing CTU tab. Cancel or navigate/sign out to abandon the preview. Ctrl+C stops the local app.

## Observable v1 boundary

The canonical shared source is [portalContract.ts](../../src/features/ctu/portalContract.ts); both extension and app build from it. The source document reader is [portalCapture.ts](../../src/features/ctu/portalCapture.ts), a self-contained function serialized by `chrome.scripting.executeScript`. Synthetic tests and the actual helper use that same reader. No separate schema generator/dependency is needed.

- Requests are channel `studyflow-ctu-preview-v1`, a per-request UUID, and operation `probe`, `collect` or `cancel`.
- The content bridge accepts same-window messages from exact origin `http://127.0.0.1:4173`, only while URL is exactly `/ctu-sync` without query/hash. Worker validates its own extension sender ID and exact content-script sender URL/tab before opening CTU.
- Replies are correlated `ready` (version 1), `result` (snapshot) or `error` (bounded safe text). App rejects other origins, stale/unknown request IDs, invalid version/extra fields, invalid dates and unsupported document URLs. Deadline text is a date or local wall time, never a silently inferred UTC timestamp.
- Snapshot version 1 contains collection UTC timestamp, displayed portal name, course label, module name/source-ID candidates, assessments with source grouping/title/due/source-ID candidate/submission indicator and page provenance, notice PDF title/URL pairs, resource titles, explicit source coverage and warnings.
- Strings/arrays are bounded; array limit 500 per field. Every persisted-planner constraint is intentionally irrelevant to this in-memory preview: no Firestore save function exists here.
- Missing pages are marked not collected. Home is explicitly next 30 days only. A changed layout fails or reports partial collection; absence never means deleted/completed. Due-date conflicts are shown. Full module labels keep KM/PM modules distinct even if course-code suffixes match.

## Collection scope and account boundary

Reads Home, Uploads, Current courses (opening exactly one current course's module table where available), Notice board and Downloads metadata. The last page provides resource titles; its tracked download links are never clicked. Uploaded files and result/grade tables are not collected. Candidate numeric IDs are not yet certified stable across terms.

The preview appears only for the current admitted StudyFlow cloud session and is cleared on sign-out/unmount. It does not persist portal data in browser storage, extension storage, files or Firebase. The extension does not receive a Firebase UID/token or either site's password/cookies. No remote server or extra paid service was added. Only the browser itself uses its existing CTU session normally.

The displayed CTU name is not verified email matching. The user acknowledges the portal account against the currently shown StudyFlow email; this checkbox confirms only a preview, not a stored connection or enrolment proof. A future persistent connection needs stronger source-account binding and new owner-scoped provenance/draft contracts and rules. Existing membership checks remain unchanged.

## Permissions and build

`scripts/build-ctu-extension.mjs` builds two local Vite bundles with the pinned dependencies and writes a Manifest V3 package. Permissions: `scripting` plus host access to `https://ctu.campusmanager.co.za/*`. One isolated bridge content script matches loopback port 4173. There is no cookies/storage/debugger/all-sites permission, external messaging receiver, telemetry or remote executable code. Host permission paths are ignored by Chromium, so the capture code additionally restricts exact origin and five known page paths.

Helper 0.1.3 waits for a newly created tab's navigation to commit, does not require a broad tabs permission to read optional app-tab metadata, and activates the one known course-detail UI link in the page MAIN world. Its DOM reader remains isolated and never accesses page JavaScript globals. Actual five-page collection is verified in [the dated results](../testing/CTU_Preview_2026-10-21.md).

```powershell
npm run build:ctu-helper
npm run check
```

The helper has its own strict TypeScript configuration. Tests cover source extraction, duplicate module suffixes, timed/date-only merges, invalid dates, private-field exclusion, malformed/oversized payloads, source/nonce validation, account gating, and synthetic worker orchestration through all five pages, cancellation and partial failure. A simulated Chrome API test does not prove browser installation or real portal collection. Follow the dated verification record for actual live status.

## Limits before any save/import feature

- Timetable/calendar PDFs are links only: no PDF parsing or classes imported.
- Portal timezone is not explicitly declared; no `dueAt` timestamp is produced yet.
- Planning type/priority/effort are unavailable from CTU. Existing Assessment requires those fields; a future deadline-only/draft state must be designed rather than fabricating estimates.
- No continuous background scheduling, browser-closed sync, CTU single sign-on, submission upload, automatic completion or automatic deletion.
- Collection needs the browser, installed helper and valid session. Permissions and automated read-only use still require institutional/provider assessment before a wider release.
- No git push, Hosting deployment, Firebase rule change, approved-student change or course submission is included.

Primary references checked during implementation: [scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting), [tabs and host permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs), [messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging), [match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns).
