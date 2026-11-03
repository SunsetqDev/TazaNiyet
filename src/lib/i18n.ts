import { KK } from "./kk";

// Язык интерфейса: русский или казахский. Ключ перевода — сама русская фраза: t("Сохранить").
// Язык читается при запуске (src/app/_layout.tsx) до загрузки экранов; смена в настройках
// сохраняется и перезапускает приложение (lib/prefs.ts), поэтому тексты на уровне модулей тоже переводятся.

export type Lang = "ru" | "kk";

let current: Lang = "ru";

export function setLangNow(l: Lang) {
  current = l;
}

export function lang(): Lang {
  return current;
}

/** Локаль для дат и чисел. */
export function locale() {
  return current === "kk" ? "kk-KZ" : "ru-RU";
}

/** Перевод фразы. {0}, {1}… — подстановки: t("Ещё {0} TZ", n). Нет перевода — русский текст. */
export function t(ru: string, ...args: (string | number | null | undefined)[]): string {
  const s = current === "kk" ? (KK[ru] ?? ru) : ru;
  return args.length ? s.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? "")) : s;
}
