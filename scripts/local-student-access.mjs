import { readFile } from 'node:fs/promises';
import { membershipEmail } from '../src/features/auth/membershipContract.ts';

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('npm run demo:approve -- student@example.test [--revoke]');
  console.log(
    'Only writes approval in the loopback demo-studyflow Firestore emulator. It never verifies email or creates an account.',
  );
} else {
  const email = membershipEmail(args[0]?.trim() ?? null);
  if (!email || args.length > 2 || (args[1] && args[1] !== '--revoke')) {
    throw new Error('Use: npm run demo:approve -- student@example.test [--revoke]');
  }
  const config = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
  const port = config.emulators?.firestore?.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid local Firestore emulator port.');
  const response = await fetch(
    `http://127.0.0.1:${port}/v1/projects/demo-studyflow/databases/(default)/documents/approvedStudents/${encodeURIComponent(email)}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { active: { booleanValue: args[1] !== '--revoke' } } }),
      signal: AbortSignal.timeout(5000),
    },
  ).catch(() => {
    throw new Error('Start npm run dev first. Only the local Firestore emulator is supported.');
  });
  if (!response.ok)
    throw new Error(`Local approval failed (${response.status}); no cloud request was sent.`);
  console.log(
    args[1] === '--revoke'
      ? 'Local student access deactivated.'
      : 'Local student approved. Email verification is still required.',
  );
}
