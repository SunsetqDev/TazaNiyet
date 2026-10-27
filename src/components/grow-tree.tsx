import type { ReactElement } from "react";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

// Палитра по «здоровью»: 0 — цветущий, 1 — слегка уставший, 2 — вянет, 3 — совсем завял
const PALETTE = [
  { leaf: "#6FA85B", light: "#8CC271", trunk: "#B08762", dark: "#8F6B49" },
  { leaf: "#8DB562", light: "#A5C77C", trunk: "#AA8866", dark: "#8C6E50" },
  { leaf: "#B3B05A", light: "#C8C272", trunk: "#9E8A6C", dark: "#85735A" },
  { leaf: "#B49A6A", light: "#C6AE82", trunk: "#8E8070", dark: "#776B5D" },
];

// Стадии роста: 0 — росток, 4 — могучий баобаб
const STAGES = [
  { h: 0, wb: 0, wt: 0, R: 0 },
  { h: 50, wb: 16, wt: 9, R: 34 },
  { h: 68, wb: 34, wt: 20, R: 50 },
  { h: 92, wb: 50, wt: 26, R: 68 },
  { h: 108, wb: 62, wt: 30, R: 82 },
];

const GROUND = 232;
const X = 120;

type Props = { stage: number; health: number; size?: number };

/** Баобаб, который растёт со стадией (0–4) и вянет со здоровьем (0–3). */
export function GrowTree({ stage, health, size = 220 }: Props) {
  const si = Math.max(0, Math.min(4, Math.round(stage)));
  const hi = Math.max(0, Math.min(3, Math.round(health)));
  const p = PALETTE[hi];
  const els: ReactElement[] = [];
  let n = 0;
  const k = () => `t${n++}`;

  els.push(<Ellipse key={k()} cx={X} cy={GROUND + 4} rx={50 + si * 10} ry={12} fill="#E3D8B8" />);

  if (si === 0) {
    if (hi >= 2) {
      // росток поник
      els.push(
        <Path key={k()} d={`M${X} ${GROUND} Q${X} ${GROUND - 14} ${X + 14} ${GROUND - 20}`} stroke="#7E9A52" strokeWidth={6} strokeLinecap="round" fill="none" />,
        <Path
          key={k()}
          d={`M${X + 14} ${GROUND - 20} Q${X + 34} ${GROUND - 18} ${X + 38} ${GROUND - 4} Q${X + 20} ${GROUND - 6} ${X + 14} ${GROUND - 20}Z`}
          fill={p.leaf}
          stroke="#7E8A4A"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    } else {
      els.push(
        <Path key={k()} d={`M${X} ${GROUND} Q${X} ${GROUND - 20} ${X} ${GROUND - 32}`} stroke="#4F8A45" strokeWidth={6} strokeLinecap="round" fill="none" />,
        <Path
          key={k()}
          d={`M${X} ${GROUND - 30} Q${X - 20} ${GROUND - 56} ${X - 42} ${GROUND - 42} Q${X - 22} ${GROUND - 22} ${X} ${GROUND - 30}Z`}
          fill={p.leaf}
          stroke="#4F8A45"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />,
        <Path
          key={k()}
          d={`M${X} ${GROUND - 30} Q${X + 20} ${GROUND - 56} ${X + 42} ${GROUND - 42} Q${X + 22} ${GROUND - 22} ${X} ${GROUND - 30}Z`}
          fill={p.light}
          stroke="#4F8A45"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      );
    }
  } else {
    const { h, wb, wt, R } = STAGES[si];
    const top = GROUND - h;
    const droop = hi >= 2;
    const sag = [0, 0, 0.12, 0.22][hi];

    // кроны-«пучки» на концах веток
    let tufts: [number, number, number][] =
      si === 1
        ? [[0, -0.55, 1.0]]
        : [
            [-0.78, -0.5, 0.7],
            [0.78, -0.5, 0.7],
            [-0.38, -0.98, 0.72],
            [0.42, -1.0, 0.7],
            [0, -0.62, 0.8],
          ];
    if (hi === 3 && si > 1) tufts = [tufts[0], tufts[1], tufts[4]];
    const sc = hi === 3 ? 0.85 : 1;

    const centers = tufts.map(([dx, dy, s]) => ({
      cx: X + dx * R,
      cy: top + (dy + sag * Math.abs(dx + 0.3)) * R,
      s: s * sc,
    }));

    // ветки
    if (si >= 2) {
      const bw = Math.max(4, wt * 0.32);
      centers.forEach((c) =>
        els.push(
          <Path key={k()} d={`M${X} ${top + 4} Q${(X + c.cx) / 2} ${top - 6} ${c.cx} ${c.cy}`} stroke={p.dark} strokeWidth={bw} strokeLinecap="round" fill="none" />
        )
      );
    }

    // ствол
    els.push(
      <Path
        key={k()}
        d={`M${X - wb / 2} ${GROUND} C${X - wb / 2 - 6} ${GROUND - h * 0.35} ${X - wt / 2 - 7} ${GROUND - h * 0.7} ${X - wt / 2} ${top} L${X + wt / 2} ${top} C${X + wt / 2 + 7} ${GROUND - h * 0.7} ${X + wb / 2 + 6} ${GROUND - h * 0.35} ${X + wb / 2} ${GROUND} Z`}
        fill={p.trunk}
        stroke={p.dark}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    );
    if (si >= 2) {
      els.push(
        <Path key={k()} d={`M${X - wb * 0.18} ${GROUND - 6} Q${X - wb * 0.12} ${GROUND - h * 0.5} ${X - wt * 0.2} ${top + 6}`} stroke={p.dark} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />,
        <Path key={k()} d={`M${X + wb * 0.2} ${GROUND - 6} Q${X + wb * 0.14} ${GROUND - h * 0.45} ${X + wt * 0.22} ${top + 8}`} stroke={p.dark} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />
      );
    }

    // листва
    centers.forEach((c) => {
      const rx = R * 0.5 * c.s;
      const ry = rx * (droop ? 0.6 : 0.74);
      els.push(<Ellipse key={k()} cx={c.cx} cy={c.cy} rx={rx} ry={ry} fill={p.leaf} />);
      if (hi < 3) {
        els.push(<Ellipse key={k()} cx={c.cx - rx * 0.18} cy={c.cy - ry * 0.25} rx={rx * 0.55} ry={ry * 0.5} fill={p.light} />);
      }
      if (droop) {
        [-0.6, 0, 0.6].forEach((kk) => {
          const lx = c.cx + kk * rx;
          const ly = c.cy + ry * 0.85;
          els.push(<Path key={k()} d={`M${lx} ${ly} q${kk * 4} 12 ${kk * 2} 20`} stroke={p.leaf} strokeWidth={5} strokeLinecap="round" fill="none" />);
        });
      }
    });

    // цветы на самом большом дереве
    if (si === 4 && hi < 2) {
      centers.slice(0, 4).forEach((c) => els.push(<Circle key={k()} cx={c.cx + 10} cy={c.cy - 4} r={4.5} fill="#F8D6E0" stroke="#E79AB0" strokeWidth={1.5} />));
    }

    // опавшие листья
    if (hi === 3) {
      [
        [X - 40, GROUND + 2, 20],
        [X + 46, GROUND + 6, -30],
        [X + 10, GROUND + 8, 10],
      ].forEach(([lx, ly, rot]) =>
        els.push(<Ellipse key={k()} cx={lx} cy={ly} rx={7} ry={3.5} fill={p.leaf} rotation={rot} origin={`${lx}, ${ly}`} />)
      );
    }
  }

  return (
    <Svg width={size} height={(size * 260) / 240} viewBox="0 -10 240 260">
      {els}
    </Svg>
  );
}