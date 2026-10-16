# Dependency baseline and audit

Reviewed 16 October 2026. Install with npm ci and commit package.json/package-lock.json together when intentionally changing versions. Direct dependencies are exact; the lockfile fixes transitive resolutions. Node 24 LTS (24.15+ within 24.x) is required. Tested locally with Node 24.19.0 and npm 10.9.2; npm 11 is also allowed by the project engines. No system/global runtime was changed during bootstrap verification.

## Selected application packages

React/React DOM 19.3.1; React Router 8.4.0; Firebase 13.0.0. Build/styling: Vite 8.3.4 and Tailwind 4.3.3. The exact development tool versions are recorded in package.json and the lockfile. Firebase initialization is lazy; the current UI does not perform account/data operations.

## Reviewed resolution override

The Firebase dependency tree initially pinned an affected gRPC package. The override `@grpc/grpc-js: ^1.13.6` keeps the compatible 1.x line above the affected range; the lockfile resolves 1.14.6. This removed the production dependency findings. Reassess/remove the override when upstream resolves a patched version itself; do not remove it without repeating the audit and relevant checks.

References: [gRPC certificate advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j), [gRPC error-detail advisory](https://github.com/advisories/GHSA-f596-whhp-79r4). The installed audit report, not a blanket safety claim, is the evidence.

## Known development-tool limitation

At this baseline:

- `npm audit --omit=dev`: **0 reported vulnerabilities**.
- Full `npm audit`: **7 affected dependency entries: 4 moderate, 3 high**, all in the optional local Firebase CLI tree (firebase-tools, chokidar/braces, gaxios/uuid, and pubsub/opentelemetry). This is not a zero-finding development environment.

The retained Firebase CLI is 15.34.0, which supports Node 24. The audit's suggested older CLI 14.23.0 requires a dependency whose engine excludes Node 24; its installation was rejected by engine-strict, so that incompatible downgrade was not applied. No force-audit fix or disabled engine check was used. The current application startup and browser build do not run the CLI. Emulation is a separate, local, optional development command, not a public service deployment.

Review and update the CLI when a supported patched release is available. Keep emulator access local and use synthetic demo data. This limitation is recorded for the team; it is not proof that every possible use of the affected tooling is safe. Relevant advisories: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [OpenTelemetry](https://github.com/advisories/GHSA-8988-4f7v-96qf), [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

Unit/UI checks, real emulator guard checks and the dependency audit measure different things. Passing tests/build does not clear an advisory or prove that future cloud integration/deployment is secure.
