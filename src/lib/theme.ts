// Дизайн-система «Тихий лес». Все экраны используют только эти токены.

export const color = {
  forest: "#153D2C",
  moss: "#1F4E39",
  mossLine: "#2A5A45",
  lime: "#C9F36A",
  limeSoft: "#EEF6DA",
  cream: "#F6F4EC",
  surface: "#FFFFFF",
  sand: "#E9E5D6",
  ink: "#252A27",
  muted: "#6E746E",
  faint: "#A3A8A1",
  line: "#E3E0D3",
  onForest: "#F6F4EC",
  onForestMuted: "#A9BFB2",
  warn: "#8A6D00",
  warnSoft: "#FFF4D6",
  danger: "#B3261E",
  dangerSoft: "#FBEAE8",
};

/** Мягкие подложки категорий заданий — только за иконкой, не на всю карточку. */
export const categoryTint: Record<string, string> = {
  clean: "#E6EFDD",
  trees: "#DDEBD3",
  recycle: "#E3ECF2",
  water: "#DCEBF0",
  edu: "#F1E8D2",
  animals: "#F3E4D9",
};

export const space = { x1: 4, x2: 8, x3: 12, x4: 16, x5: 20, x6: 24, x8: 32, x10: 40, gutter: 20 };
export const radius = { icon: 12, field: 16, card: 24, hero: 28, pill: 999 };

/** Имена шрифтов — как их регистрирует useFonts в src/app/_layout.tsx. Оба шрифта поддерживают казахскую кириллицу. */
export const font = {
  display: "Literata_600SemiBold",
  displayMedium: "Literata_500Medium",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const type = {
  display: { fontFamily: font.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h1: { fontFamily: font.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: font.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: "uppercase" as const },
  number: { fontFamily: font.bold, fontSize: 18, lineHeight: 22 },
};

export type TypeVariant = keyof typeof type;
