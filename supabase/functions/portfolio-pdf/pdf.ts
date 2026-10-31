// Вёрстка PDF-портфолио TazaNiyet (A4). Библиотеки передаются снаружи, чтобы один и тот же код
// работал и в функции Supabase (Deno, npm:-импорты), и в локальной проверке (Node).

export type PortfolioTask = { title: string; points: number; date: string; cleanup?: boolean };
export type PortfolioData = {
  fullName: string;
  place: string;
  points: number;
  tasks: PortfolioTask[];
  code: string;
  issued: Date;
};
export type Fonts = { regular: Uint8Array; semibold: Uint8Array; bold: Uint8Array; display: Uint8Array };

const RANKS: [number, string][] = [
  [5000, "Хранитель степи"],
  [1500, "Страж природы"],
  [500, "Дерево"],
  [100, "Побег"],
  [0, "Росток"],
];
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

const pad = (n: number) => String(n).padStart(2, "0");
// даты по времени Казахстана (UTC+5), а не по часам сервера
const kz = (d: Date) => new Date(d.getTime() + 5 * 3600 * 1000);
const fmtDate = (d: Date) => {
  const k = kz(d);
  return `${pad(k.getUTCDate())}.${pad(k.getUTCMonth() + 1)}.${k.getUTCFullYear()}`;
};

export async function buildPortfolioPdf(libs: any, fonts: Fonts, data: PortfolioData): Promise<Uint8Array> {
  const { PDFDocument, rgb, fontkit, QRCode } = libs;
  const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
  const C = {
    forest: hex("#153D2C"),
    moss: hex("#1F4E39"),
    lime: hex("#C9F36A"),
    cream: hex("#F6F4EC"),
    sand: hex("#E9E5D6"),
    ink: hex("#252A27"),
    muted: hex("#6E746E"),
    faint: hex("#A3A8A1"),
    line: hex("#E3E0D3"),
    white: rgb(1, 1, 1),
  };

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Портфолио TazaNiyet — ${data.fullName}`);
  doc.setAuthor("TazaNiyet");
  doc.setCreator("TazaNiyet");
  // Inter встраиваем целиком: при subset fontkit теряет часть букв (кириллица пропадала)
  const F = {
    regular: await doc.embedFont(fonts.regular, { subset: false }),
    semibold: await doc.embedFont(fonts.semibold, { subset: false }),
    bold: await doc.embedFont(fonts.bold, { subset: false }),
    display: await doc.embedFont(fonts.display, { subset: true }),
  };

  // убираем символы, которых нет в шрифте (эмодзи и т. п.), иначе pdf-lib падает
  const charsets = new Map<any, Set<number>>();
  const clean = (font: any, text: string) => {
    let set = charsets.get(font);
    if (!set) {
      set = new Set<number>(font.getCharacterSet());
      charsets.set(font, set);
    }
    return Array.from(text ?? "")
      .filter((ch) => set!.has(ch.codePointAt(0)!))
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  };
  const width = (font: any, text: string, size: number) => font.widthOfTextAtSize(text, size);
  const fit = (font: any, text: string, size: number, max: number) => {
    let t = clean(font, text);
    if (width(font, t, size) <= max) return t;
    while (t.length > 1 && width(font, t + "…", size) > max) t = t.slice(0, -1);
    return t.trimEnd() + "…";
  };
  const wrap = (font: any, text: string, size: number, max: number) => {
    const lines: string[] = [];
    let cur = "";
    for (const w of clean(font, text).split(" ")) {
      const next = cur ? cur + " " + w : w;
      if (width(font, next, size) > max && cur) {
        lines.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const W = 595.28,
    H = 841.89,
    M = 40;
  const roundRect = (page: any, x: number, y: number, w: number, h: number, r: number, color: any) => {
    const p = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
    page.drawSvgPath(p, { x, y: y + h, color, borderWidth: 0 });
  };

  const name = clean(F.display, data.fullName) || "Участник";
  const pages: any[] = [];
  const footer = (page: any) => {
    page.drawText(clean(F.regular, "Документ сформирован автоматически по данным, подтверждённым модераторами TazaNiyet."), {
      x: M,
      y: 26,
      size: 7.5,
      font: F.regular,
      color: C.faint,
    });
  };

  // ===== Страница 1: шапка =====
  let page = doc.addPage([W, H]);
  pages.push(page);
  page.drawRectangle({ x: 0, y: H - 132, width: W, height: 132, color: C.forest });
  page.drawText("TazaNiyet", { x: M, y: H - 70, size: 32, font: F.display, color: C.cream });
  const tzX = M + width(F.display, "TazaNiyet", 32) + 14;
  page.drawCircle({ x: tzX, y: H - 50, size: 10, borderColor: C.lime, borderWidth: 1.4 });
  page.drawText("tz", { x: tzX - width(F.semibold, "tz", 9) / 2, y: H - 53.2, size: 9, font: F.semibold, color: C.lime });
  page.drawText(clean(F.semibold, "ЭКО-ПОРТФОЛИО ВОЛОНТЁРА"), { x: M, y: H - 98, size: 9.5, font: F.semibold, color: C.lime });
  const issued = `Выдано ${fmtDate(data.issued)}`;
  page.drawText(clean(F.regular, issued), { x: W - M - width(F.regular, issued, 10), y: H - 66, size: 10, font: F.regular, color: C.cream });

  // ===== Имя и место =====
  let y = H - 132 - 52;
  page.drawText(fit(F.display, name, 26, W - 2 * M), { x: M, y, size: 26, font: F.display, color: C.ink });
  y -= 22;
  if (data.place) {
    page.drawText(fit(F.regular, data.place, 11, W - 2 * M), { x: M, y, size: 11, font: F.regular, color: C.muted });
    y -= 10;
  }

  // ===== Карточки со сводкой =====
  const rank = RANKS.find(([min]) => data.points >= min)![1];
  const cleanups = data.tasks.filter((t) => t.cleanup).length;
  const stats: [string, string][] = [
    [String(data.points), "очков TZ"],
    [rank, "ранг"],
    [String(data.tasks.length), "заданий подтверждено"],
    [String(cleanups), "уборок мест с карты"],
  ];
  const gap = 10,
    cw = (W - 2 * M - gap * 3) / 4,
    ch = 66;
  y -= 18 + ch;
  stats.forEach(([v, label], i) => {
    const x = M + i * (cw + gap);
    roundRect(page, x, y, cw, ch, 12, C.sand);
    const vs = v.length > 9 ? 13 : 20;
    page.drawText(fit(F.display, v, vs, cw - 20), { x: x + 12, y: y + ch - 14 - vs, size: vs, font: F.display, color: C.ink });
    page.drawText(fit(F.regular, label, 8.5, cw - 20), { x: x + 12, y: y + 12, size: 8.5, font: F.regular, color: C.muted });
  });

  // ===== Проверка подлинности: QR + код =====
  const boxH = 118;
  y -= 18 + boxH;
  roundRect(page, M, y, W - 2 * M, boxH, 14, C.forest);
  const qr = QRCode.create(`tazaniyet:${data.code}`, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrSize = 92,
    cell = qrSize / (n + 2);
  const qx = M + 13,
    qy = y + (boxH - qrSize) / 2;
  page.drawRectangle({ x: qx, y: qy, width: qrSize, height: qrSize, color: C.white });
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      if (qr.modules.get(r, c))
        page.drawRectangle({ x: qx + (c + 1) * cell, y: qy + qrSize - (r + 2) * cell, width: cell + 0.05, height: cell + 0.05, color: C.forest });
  const tx = qx + qrSize + 18,
    tw = W - M - 16 - tx;
  page.drawText(clean(F.semibold, "ПРОВЕРКА ПОДЛИННОСТИ"), { x: tx, y: y + boxH - 26, size: 9, font: F.semibold, color: C.lime });
  // код рисуем по одной букве: иначе Inter превращает «2x9» в «2×9», и код читается неверно
  let cx = tx;
  for (const ch of clean(F.bold, `Код: ${data.code}`)) {
    page.drawText(ch, { x: cx, y: y + boxH - 50, size: 19, font: F.bold, color: C.cream });
    cx += width(F.bold, ch, 19) + 0.6;
  }
  const how =
    "Откройте приложение TazaNiyet → Профиль → Моё портфолио → «Проверить чужой код» и введите этот код или отсканируйте QR. " +
    "Приложение покажет данные из базы — так можно убедиться, что документ настоящий.";
  wrap(F.regular, how, 8.6, tw)
    .slice(0, 4)
    .forEach((line, i) => page.drawText(line, { x: tx, y: y + boxH - 68 - i * 11.5, size: 8.6, font: F.regular, color: C.cream }));

  // ===== Список подтверждённых заданий =====
  y -= 38;
  page.drawText(clean(F.display, "Подтверждённые задания"), { x: M, y, size: 16, font: F.display, color: C.ink });
  y -= 14;

  const newPage = () => {
    footer(page);
    page = doc.addPage([W, H]);
    pages.push(page);
    page.drawText("TazaNiyet", { x: M, y: H - 46, size: 14, font: F.display, color: C.forest });
    const t = fit(F.regular, `портфолио · ${name}`, 9, 300);
    page.drawText(t, { x: W - M - width(F.regular, t, 9), y: H - 44, size: 9, font: F.regular, color: C.muted });
    page.drawLine({ start: { x: M, y: H - 56 }, end: { x: W - M, y: H - 56 }, thickness: 0.8, color: C.line });
    y = H - 80;
  };

  if (data.tasks.length === 0) {
    y -= 18;
    page.drawText(clean(F.regular, "Подтверждённых заданий пока нет."), { x: M, y, size: 10.5, font: F.regular, color: C.muted });
  } else {
    let lastMonth = "";
    for (const t of data.tasks) {
      const d = new Date(t.date);
      const month = `${MONTHS[kz(d).getUTCMonth()]} ${kz(d).getUTCFullYear()}`;
      if (month !== lastMonth) {
        if (y < 90) newPage();
        y -= 22;
        page.drawText(clean(F.semibold, month.toUpperCase()), { x: M, y, size: 8.5, font: F.semibold, color: C.forest });
        y -= 6;
        lastMonth = month;
      }
      if (y < 70) newPage();
      y -= 20;
      page.drawText(fmtDate(d), { x: M, y: y + 5, size: 9.5, font: F.regular, color: C.muted });
      page.drawText(fit(F.regular, t.title, 10.5, 330), { x: M + 78, y: y + 5, size: 10.5, font: F.regular, color: C.ink });
      const pts = `+${t.points} TZ`;
      page.drawText(pts, { x: W - M - width(F.semibold, pts, 10), y: y + 5, size: 10, font: F.semibold, color: C.forest });
      page.drawLine({ start: { x: M, y: y - 2 }, end: { x: W - M, y: y - 2 }, thickness: 0.6, color: C.line });
    }
  }
  footer(page);

  // номера страниц
  pages.forEach((p, i) => {
    const t = `стр. ${i + 1} из ${pages.length}`;
    p.drawText(t, { x: W - M - width(F.regular, t, 7.5), y: 26, size: 7.5, font: F.regular, color: C.faint });
  });

  return await doc.save();
}
