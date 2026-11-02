import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ICON_ALIASES, ICON_PATHS } from "./icon-paths";

/** Имена — как у Ionicons (в данных и старом коде), рисуются собственным набором «росток». */
export type IconName = React.ComponentProps<typeof Ionicons>["name"];

// иконки-линии без «тела» — у них нечего закрашивать
const LINE = new Set(["add", "arrow-back", "arrow-up", "chevron-forward", "close", "checkmark", "checkmark-done", "ellipsis-horizontal", "ellipsis-vertical", "refresh", "list", "settings", "speedometer", "navigate"]);

type Props = { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> };

/** Иконка TazaNiyet. Вариант без -outline — «залитый»: тело иконки слегка закрашено.
 *  Если для имени ещё нет своего рисунка — показывается обычная Ionicons. */
export function Icon({ name, size = 24, color = "#252A27", style }: Props) {
  const base = String(name).replace(/-(outline|sharp)$/, "");
  const key = ICON_ALIASES[base] ?? base;
  const paths = ICON_PATHS[key];
  if (!paths) return <Ionicons name={name} size={size} color={color} style={style as never} />;
  const filled = !String(name).endsWith("-outline");
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {paths.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled && i === 0 && !LINE.has(key) ? color : "none"}
          fillOpacity={0.22}
        />
      ))}
    </Svg>
  );
}

// фирменная «капля-листок» за иконкой — вместо пастельных квадратиков
const BLOB = "M5.2 19.6C2.4 16.1 3.4 9.2 8.6 6.1c4.6-2.7 10.6-1.6 11.5 3.5 1.1 6.3-4 11.6-9.4 11.9-2.2.1-4.2-.4-5.5-1.9z";

/** Иконка или эмодзи на лаймовой капле (сдвинута вправо-вниз). size — сторона блока. */
export function IconBlob({ children, tint = "#C9F36A", size = 40 }: { children: ReactNode; tint?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: size * 0.07, top: size * 0.05 }}>
        <Path d={BLOB} fill={tint} />
      </Svg>
      {children}
    </View>
  );
}
