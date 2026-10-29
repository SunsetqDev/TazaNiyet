import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { color, radius, space } from "../../lib/theme";
import { PressScale } from "../anim";

type Variant = "surface" | "hero" | "sand";

type Props = {
  children?: ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const VARIANT: Record<Variant, ViewStyle> = {
  surface: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.card },
  hero: { backgroundColor: color.forest, borderRadius: radius.hero },
  sand: { backgroundColor: color.sand, borderRadius: radius.card },
};

/** Карточка без теней. hero — тёмно-зелёная, одна на экран. */
export function Card({ children, variant = "surface", onPress, style }: Props) {
  const box = [{ padding: space.x4 }, VARIANT[variant], style];
  if (onPress) {
    return (
      <PressScale onPress={onPress} scaleTo={0.98} style={box}>
        {children}
      </PressScale>
    );
  }
  return <View style={box}>{children}</View>;
}
