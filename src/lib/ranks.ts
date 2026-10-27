export const RANKS = [
  { min: 0, name: "Росток", icon: "🌱", next: 100 },
  { min: 100, name: "Побег", icon: "🌿", next: 500 },
  { min: 500, name: "Дерево", icon: "🌳", next: 1500 },
  { min: 1500, name: "Страж природы", icon: "🏔", next: 5000 },
  { min: 5000, name: "Хранитель степи", icon: "🦅", next: null as number | null },
];

export function getRankIndex(points: number) {
  let idx = 0;
  RANKS.forEach((r, i) => {
    if (points >= r.min) idx = i;
  });
  return idx;
}

export function getRank(points: number) {
  return RANKS[getRankIndex(points)];
}