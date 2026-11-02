import { Text } from "react-native";
import { SvgXml } from "react-native-svg";
import { color } from "../lib/theme";

// Рисунки категорий заданий вместо эмодзи (в стиле иконок-наклеек): сетка 48×48, тёмный контур, мягкие цвета.
const F = color.forest;
const ART: Record<string, string> = {
  clean: `<path d="M15 19c-3.5 4.5-5.5 10.5-4.5 15.5 1 5.5 6 8.5 13.5 8.5s12.5-3 13.5-8.5c1-5-1-11-4.5-15.5z" fill="#2F6B4C" stroke="${F}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M18 19.5c2-1.5 4-2.2 6-2.2s4 .7 6 2.2" stroke="${F}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M24 17.3c-2-3-5.5-4.5-8-3.5 1 3 4.5 4.5 8 3.5zm0 0c2-3 5.5-4.5 8-3.5-1 3-4.5 4.5-8 3.5z" fill="#C9F36A" stroke="${F}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 29c.5-3 2-5.5 4-7" stroke="#C9F36A" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
  trees: `<path d="M7 42c5-5 29-5 34 0z" fill="#B98A5A" stroke="${F}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M24 41V25" stroke="${F}" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 27c-8 0-12-5-12-11S17 5 24 5s12 5 12 11-4 11-12 11z" fill="#7FB35A" stroke="${F}" stroke-width="2.6"/>
    <path d="M18 14c1-3 3.5-5 6.5-5.5" stroke="#C9F36A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M24 33l-5-4" stroke="${F}" stroke-width="2.6" stroke-linecap="round"/>`,
  recycle: `<path d="M20 5h8v6c4.5 2 6.5 6 6.5 10v18.5a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V21c0-4 2-8 6.5-10z" fill="#BFE0EA" stroke="${F}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M19 4.5h10" stroke="${F}" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M13.5 24h21v10h-21z" fill="#C9F36A" stroke="${F}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M21 29.5l3-3 3 3m-3-3V32" stroke="${F}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17.5 19c.6-2 1.8-3.4 3.5-4.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  water: `<path d="M24 5s13.5 14 13.5 24.5a13.5 13.5 0 0 1-27 0C10.5 19 24 5 24 5z" fill="#7CC3D6" stroke="${F}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M13 31c3.5-2.5 7-2.5 11 0s7.5 2.5 11 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M17 24c.3-3 1.8-6 4-8.5" stroke="#E8F6FA" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  edu: `<path d="M5 15c6.5-2.5 13-1.5 19 3 6-4.5 12.5-5.5 19-3v25c-6.5-2.5-13-1.5-19 3-6-4.5-12.5-5.5-19-3z" fill="#FFF8E6" stroke="${F}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M24 18v25" stroke="${F}" stroke-width="2.6"/>
    <path d="M10 22c3-.8 6-.5 9 1M10 28c3-.8 6-.5 9 1M29 23c3-1.5 6-1.8 9-1M29 29c3-1.5 6-1.8 9-1" stroke="#C9B98A" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M24 17c0-4 0-7 0-9m0 4c-.5-3.5-3-5.5-6-5.5.3 3.3 2.7 5.5 6 5.5zm0-1c.5-3.5 3-5.5 6-5.5-.3 3.3-2.7 5.5-6 5.5z" fill="#C9F36A" stroke="${F}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`,
  animals: `<path d="M24 41c-6 0-10-3-10-7.5S18.5 24 24 24s10 5 10 9.5S30 41 24 41z" fill="#E9B987" stroke="${F}" stroke-width="2.6"/>
    <ellipse cx="12.5" cy="22" rx="4" ry="5" fill="#E9B987" stroke="${F}" stroke-width="2.6" transform="rotate(-20 12.5 22)"/>
    <ellipse cx="19.5" cy="13.5" rx="4" ry="5.5" fill="#E9B987" stroke="${F}" stroke-width="2.6" transform="rotate(-8 19.5 13.5)"/>
    <ellipse cx="28.5" cy="13.5" rx="4" ry="5.5" fill="#E9B987" stroke="${F}" stroke-width="2.6" transform="rotate(8 28.5 13.5)"/>
    <ellipse cx="35.5" cy="22" rx="4" ry="5" fill="#E9B987" stroke="${F}" stroke-width="2.6" transform="rotate(20 35.5 22)"/>
    <path d="M19 31c1-2.5 3-4 5-4.5" stroke="#FFF1E0" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
};

/** Рисунок задания по категории (clean, trees, recycle, water, edu, animals); неизвестная — эмодзи из данных. */
export function TaskArt({ category, emoji, size = 28 }: { category?: string | null; emoji?: string | null; size?: number }) {
  const art = category ? ART[category] : undefined;
  if (!art) return <Text style={{ fontSize: size * 0.8 }}>{emoji ?? "🌱"}</Text>;
  return <SvgXml xml={`<svg viewBox="0 0 48 48">${art}</svg>`} width={size} height={size} />;
}
