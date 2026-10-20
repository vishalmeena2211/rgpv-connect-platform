import type { SemesterResult } from '@rgpv/shared';

/**
 * RGPV's "Print Marksheet", rebuilt from a fetched result.
 *
 * On result.rgpv.ac.in the link opens a window holding only the grading panel
 * (`pnlGrading`) with the portal's `resultsCSS.css`, and calls `self.print()`
 * on load. This writes the same document: the same tables in the same order,
 * the same rules from that stylesheet, and the same print-on-load, so the PDF a
 * student saves matches the one RGPV's page gives. The values come from the
 * result RGPV returned; nothing is computed here.
 *
 * Two additions, neither of which changes the marksheet: a toolbar that only
 * shows on screen, and one small line under the panel saying where and when
 * the result was fetched.
 */

const TZ = 'Asia/Kolkata';

// The rules from RGPV's resultsCSS.css that the grading panel uses (read 21 Oct 2026).
const RGPV_CSS = `
body{font-family:Verdana,Arial;font-size:12px;color:#333333;line-height:1.166;margin:0;padding:5px 0 0 0;background-color:#EBEEF3;}
table.gridtable{font-family:verdana,arial,sans-serif;font-size:11px;color:#333333;border-width:1px;border-color:#666666;border-collapse:collapse;}
table.gridtable th{border-width:1px;padding:8px;border-style:solid;border-color:#666666;background-color:#dedede;}
table.gridtable td{border-width:1px;padding:8px;border-style:solid;border-color:#666666;background-color:#ffffff;}
.resultheader{background:#f9f4d6;height:90px;border:#bcb58b 1px solid;text-align:center;font-family:Tahoma,Arial,Helvetica,sans-serif;color:#302603;font-size:24px;font-weight:bold;line-height:34px;}
`;

// Ours: the screen-only toolbar and the source line.
const PAGE_CSS = `
.toolbar{display:flex;gap:10px;justify-content:center;align-items:center;padding:10px 12px 14px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px;}
.toolbar button{font:inherit;font-weight:600;color:#fff;background:#0F8A6F;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;}
.toolbar a{color:#0F2A24;font-weight:600;}
.source{width:70%;margin:6px auto 0;text-align:left;font-size:10px;color:#666666;}
.panel{border-width:1px;border-style:dotted;width:100%;background:#ffffff;}
@media print{.toolbar{display:none;}}
@media (max-width:700px){table.outer{width:100% !important;}.source{width:100%;}}
`;

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** RGPV prints credits as whole numbers and grade averages to two places. */
function num(value: number | undefined, places?: number): string {
  if (value == null) return '';
  return places == null ? String(value) : value.toFixed(places);
}

function fetchedLabel(fetchedAt: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  }).format(new Date(fetchedAt));
}

function detailRow(label: string, value: string | number | undefined, label2: string, value2: string | number | undefined): string {
  return `<tr>
<td align="left" style="width: 10%">${esc(label)}</td>
<td align="left" style="width: 15%"><span style="color:Black;">${esc(value)}</span></td>
<td align="left" style="width: 10%; color: #333333;">${esc(label2)}</td>
<td align="left" style="width: 15%"><span style="color:Black;">${esc(value2)}</span></td>
</tr>`;
}

export function marksheetTitle(result: SemesterResult): string {
  return `RGPV Result ${result.enrollment} Semester ${result.semester}`;
}

export function renderMarksheet(result: SemesterResult, options: { fetchedAt: string; backHref: string }): string {
  const subjects = result.subjects
    .map(
      (subject) => `<table class="gridtable" style="width: 100%"><tr>
<td align="center" style="width: 25%">${esc(subject.name)}</td>
<td align="center" style="width: 25%">${esc(num(subject.totalMarks))}</td>
<td align="center" style="width: 25%">${esc(num(subject.earnedMarks))}</td>
<td align="center" style="width: 25%">${esc(subject.grade)}</td>
</tr></table>`,
    )
    .join('\n');

  const revaluation =
    result.revaluationDate || result.revaluationLateFeeDate
      ? `<tr><th>Revaluation Date</th><th>Revaluation Date with Late Fee</th><th></th></tr>
<tr><td align="center">${esc(result.revaluationDate)}</td><td align="center">${esc(result.revaluationLateFeeDate)}</td><td></td></tr>`
      : '';

  const panel = `<div class="panel">
<table class="outer" style="width: 70%">
<tr><td class="resultheader">Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal</td></tr>
<tr><td>
<table class="gridtable" style="width: 100%">
<tr><th align="center" colspan="4"><span>Statement of Marks${result.session ? `&nbsp;- ${esc(result.session)}` : ''}</span></th></tr>
${detailRow('Name', result.name, 'Roll No.', result.enrollment)}
${detailRow('Course', result.course, 'Branch', result.branch)}
${detailRow('Semester', result.semester, 'Status', result.candidateStatus)}
</table>
<table class="gridtable" style="width: 100%"><tr>
<th style="width: 25%">Subject</th><th style="width: 25%">Total Credit</th><th style="width: 25%">Earned Credit</th><th style="width: 25%">Grade</th>
</tr></table>
${subjects}
<table class="gridtable" style="width: 100%">
<tr><th style="width: 35%">Result Des.</th><th style="width: 35%">SGPA</th><th style="width: 30%">CGPA</th></tr>
<tr><td align="center">${esc(result.resultDescription)}</td><td align="center">${esc(num(result.sgpa, 2))}</td><td align="center">${esc(num(result.cgpa, 2))}</td></tr>
${revaluation}
</table>
<table class="gridtable" style="width: 100%">
<tr><td align="left"><b>Data Source :</b> Rajiv Gandhi Proudyogiki Vishwavidyalaya, Bhopal</td></tr>
<tr><td align="left"><b>Disclaimer :</b> The data belongs to RGPV,Bhopal. For any communication related to the published data, please contact examination cell of RGPV or respective College.</td></tr>
</table>
</td></tr>
</table>
</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${esc(marksheetTitle(result))}</title>
<style>${RGPV_CSS}${PAGE_CSS}</style>
</head>
<body onload="self.print()">
<div class="toolbar">
<button type="button" onclick="self.print()">Print or save as PDF</button>
<a href="${esc(options.backHref)}">Back to result</a>
</div>
<center>
${panel}
<p class="source">Fetched from result.rgpv.ac.in on ${esc(fetchedLabel(options.fetchedAt))} via rgpvconnect.co.in. RGPV's portal is the official source.</p>
</center>
</body>
</html>`;
}

/** Shown in the print window when there is no result to print. */
export function renderMarksheetMessage(message: string, backHref: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="noindex, nofollow" /><title>Marksheet</title>
<style>${PAGE_CSS}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#F6F6F3;color:#0F2A24;margin:0;padding:48px 16px;text-align:center;}p{max-width:420px;margin:0 auto 16px;line-height:1.5;}</style></head>
<body><p>${esc(message)}</p><p><a href="${esc(backHref)}">Back to result</a></p></body>
</html>`;
}
