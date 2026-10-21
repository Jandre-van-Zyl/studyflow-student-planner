import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parseGradeText } from './gradeContract';
GlobalWorkerOptions.workerSrc = workerUrl;
export async function readGradePdf(file: File, year: number) {
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 5 * 1024 * 1024)
    throw new Error('Choose a PDF smaller than 5 MB.');
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    enableXfa: false,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 20) throw new Error('Choose a report with at most 20 pages.');
    const lines: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      let line = '',
        lastY: number | undefined;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const y = item.transform[5] as number;
        if (lastY !== undefined && Math.abs(y - lastY) > 3 && line) {
          lines.push(line);
          line = '';
        }
        line += (line ? ' ' : '') + item.str;
        lastY = y;
        if (item.hasEOL) {
          lines.push(line);
          line = '';
          lastY = undefined;
        }
      }
      if (line) lines.push(line);
    }
    return parseGradeText(lines.join('\n'), year);
  } finally {
    await task.destroy();
  }
}
