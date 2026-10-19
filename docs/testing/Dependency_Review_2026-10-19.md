# Dependency review -19October2026

Reviewed the existing lockfile/toolchain without changing dependencies or running automatic fixes.

| Command                       | Actual result                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm audit --omit=dev --json` | 0known findings across all severities in the production dependency tree.                                                                                          |
| `npm audit --json`            | 7affected dependency entries:3high,4moderate,0critical. All are in the Firebase CLI development-tool dependency chain; these are not7independent root advisories. |

Three root advisory reports concern [OpenTelemetry baggage parsing](https://github.com/advisories/GHSA-8988-4f7v-96qf), [braces deeply nested patterns](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The affected chain includes firebase-tools, chokidar, braces, gaxios, uuid, Google Cloud Pub/Sub and OpenTelemetry. Current advisory pages and the actual npm audit were checked19October.

The proposed automatic fix changes firebase-tools15.34.0 to14.23.0, marked a major version change by npm. It is not an approved or verified compatible upgrade. No `audit fix --force`, dependency downgrade, global installation or lockfile rewrite was performed. Production browser dependencies have no reported advisories in this audit; that does not establish that the application or development tools have no vulnerabilities.

Retain the reviewed lockfile and rerun the audit on the final release candidate. Review a supported CLI release or narrowly scoped transitive update in a separate tested dependency change; rerun emulator/startup/build/deploy checks before adoption. Developer-tool findings remain open rather than silently marked fixed. Raw JSON results are in the private project planning execution folder.
