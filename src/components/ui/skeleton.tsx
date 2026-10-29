import { useEffect } from "react";
import { type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { color, radius } from "../../lib/theme";

type Props = { width?: DimensionValue; height?: number; round?: number; style?: StyleProp<ViewStyle> };

/** Заглушка на время загрузки: мягко пульсирует прозрачностью (без бликов, дёшево). */
export function Skeleton({ width = "100%", height = 16, round = 8, style }: Props) {
  const reduce = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [reduce]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: round, backgroundColor: color.sand }, a, style]} />;
}

/** Заглушка карточки со скруглением карточки. */
export function SkeletonCard({ height = 120, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  return <Skeleton height={height} round={radius.card} style={style} />;
}
