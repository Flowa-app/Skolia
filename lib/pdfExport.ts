import { CorrectionResult, CorrectionParams } from './types';

const PAGE_W = 210;
const PAGE_H = 297;
const M      = 15;               // left/right margin (mm)
const CW     = PAGE_W - 2 * M;  // 180 mm content width
const PAD    = 5;                // inner horizontal padding inside boxes
const TW     = CW - 2 * PAD;    // 170 mm text wrap width
const LH     = 6;                // line height (mm)
const HEADER = 31;               // header height
const FOOTER = 14;               // reserved at bottom
const MAX_Y  = PAGE_H - FOOTER;  // 283 mm

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

function header(doc: Doc, subtitle: string, params: Partial<CorrectionParams>): void {
  doc.setFillColor(76, 29, 149);
  doc.rect(0, 0, PAGE_W, 28, 'F');
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 28, PAGE_W, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Skolia', M, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(196, 181, 253);
  doc.text('·', M + 21, 12);
  doc.setTextColor(237, 233, 254);
  doc.text(subtitle, M + 27, 12);

  const exerciseLabel = Array.isArray(params.exerciseTypes) ? params.exerciseTypes.join(', ') : '';
  const meta = [params.subject, params.classLevel, exerciseLabel].filter(Boolean).join(' · ');
  doc.setFontSize(8);
  doc.setTextColor(167, 139, 250);
  const metaLines: string[] = doc.splitTextToSize(meta, CW);
  doc.text(metaLines[0] ?? '', M, 22);
}

function footer(doc: Doc, date: string): void {
  doc.setDrawColor(210, 200, 230);
  doc.setLineWidth(0.3);
  doc.line(M, PAGE_H - 10, PAGE_W - M, PAGE_H - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(170, 150, 200);
  doc.text(`Généré par Skolia — ${date}`, M, PAGE_H - 5);
  doc.setTextColor(147, 120, 190);
  doc.text('skolia.app', PAGE_W - M, PAGE_H - 5, { align: 'right' });
}

export async function exportToPDF(
  result: CorrectionResult,
  params: Partial<CorrectionParams>,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('fr-FR');

  header(doc, 'Rapport de correction', params);
  let y = HEADER + 9;

  // ── Grade banner ──────────────────────────────────────────────────────────
  doc.setFillColor(76, 29, 149);
  doc.roundedRect(M, y, CW, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(result.grade, M + PAD, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(216, 180, 254);
  doc.text('NOTE PROPOSÉE', M + PAD, y + 5.5);
  const meta = [params.gradingScale, params.severity ? `Correction ${params.severity}` : ''].filter(Boolean).join(' · ');
  doc.setFontSize(8.5);
  doc.setTextColor(233, 213, 255);
  doc.text(meta, PAGE_W - M - PAD, y + 12, { align: 'right' });
  y += 28;

  // ── Section helper ────────────────────────────────────────────────────────
  function section(
    title: string,
    body: string,
    fontSize: number,
    titleRgb: [number, number, number],
    bgRgb:    [number, number, number],
    textRgb:  [number, number, number],
    italic = false,
    wrapW = TW,
    boxX  = M,
    boxW  = CW,
  ): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const lines: string[] = doc.splitTextToSize(body, wrapW);
    const boxH = lines.length * LH + 18;

    if (y + boxH > MAX_Y) {
      footer(doc, date);
      doc.addPage();
      header(doc, 'Rapport de correction (suite)', params);
      y = HEADER + 9;
    }

    doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
    doc.setDrawColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'FD');

    doc.setFillColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    doc.roundedRect(boxX, y, boxW, 10, 3, 3, 'F');
    doc.rect(boxX, y + 5, boxW, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title, boxX + PAD, y + 7);

    doc.setFont('helvetica', italic ? 'italic' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    let ty = y + 16;
    for (const line of lines) { doc.text(line, boxX + PAD, ty); ty += LH; }

    y += boxH + 4;
  }

  // ── Annotations (10pt) ────────────────────────────────────────────────────
  section('ANNOTATIONS DÉTAILLÉES', result.annotations, 10,
    [88, 28, 135], [248, 240, 255], [30, 10, 60]);

  // ── Two columns: points positifs + à améliorer (10pt) ─────────────────────
  const GAP  = 4;
  const HW   = (CW - GAP) / 2;
  const HTW  = HW - 2 * PAD;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const gLines: string[] = doc.splitTextToSize(result.goodPoints,  HTW);
  const iLines: string[] = doc.splitTextToSize(result.improvements, HTW);
  const colH = Math.max(gLines.length, iLines.length) * LH + 18;
  const c2X  = M + HW + GAP;

  if (y + colH > MAX_Y) {
    footer(doc, date);
    doc.addPage();
    header(doc, 'Rapport de correction (suite)', params);
    y = HEADER + 9;
  }

  // Green
  doc.setFillColor(240, 253, 244); doc.setDrawColor(134, 239, 172); doc.setLineWidth(0.2);
  doc.roundedRect(M, y, HW, colH, 3, 3, 'FD');
  doc.setFillColor(21, 128, 61);
  doc.roundedRect(M, y, HW, 10, 3, 3, 'F'); doc.rect(M, y + 5, HW, 5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text('POINTS POSITIFS', M + PAD, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 83, 45);
  { let gy = y + 16; for (const l of gLines) { doc.text(l, M + PAD, gy); gy += LH; } }

  // Orange
  doc.setFillColor(255, 247, 237); doc.setDrawColor(253, 186, 116);
  doc.roundedRect(c2X, y, HW, colH, 3, 3, 'FD');
  doc.setFillColor(194, 65, 12);
  doc.roundedRect(c2X, y, HW, 10, 3, 3, 'F'); doc.rect(c2X, y + 5, HW, 5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
  doc.text('À AMÉLIORER', c2X + PAD, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(124, 45, 18);
  { let iy = y + 16; for (const l of iLines) { doc.text(l, c2X + PAD, iy); iy += LH; } }

  y += colH + 4;

  // ── Student comment (10pt italic) ─────────────────────────────────────────
  section("COMMENTAIRE POUR L'ÉLÈVE", `"${result.studentComment}"`, 10,
    [161, 98, 7], [254, 252, 232], [92, 64, 7], true);

  footer(doc, date);

  const safe = (s: string) => s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  doc.save(`correction_${safe(params.subject || 'copie')}_${safe(params.classLevel || '')}_${date.replace(/\//g, '-')}.pdf`);
}
