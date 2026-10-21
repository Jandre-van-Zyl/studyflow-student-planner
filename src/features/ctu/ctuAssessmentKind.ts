/** CTU FA labels are assignments; other source names do not establish an assessment type. */
export function isCtuAssignment(title: string): boolean {
  return /(?:^|[^a-z0-9])FA(?:[\s_-]*\d+)?(?=$|[^a-z0-9])/i.test(title);
}
