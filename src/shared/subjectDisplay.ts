// Generated codes are stable uniqueness keys; students recognise the module name.
export function subjectDisplay(subject: { code: string; name: string }, includeName = false) {
  if (/^CTU-[A-F0-9]{16}$/.test(subject.code)) return subject.name;
  return includeName ? `${subject.code} · ${subject.name}` : subject.code;
}
