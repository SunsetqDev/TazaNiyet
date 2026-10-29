import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { haptic } from "../lib/haptics";

const APressable = Animated.createAnimatedComponent(Pressable);

/** Кнопка, которая «продавливается» при нажатии и пружинит обратно (как в Duolingo). */
export function PressScale({
  children,
  onPress,
  style,
  scaleTo = 0.95,
  silent = false,
  disabled = false,
}: {
  children?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  silent?: boolean;
  disabled?: boolean;
}) {
  const sc = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <APressable
      disabled={disabled}
      onPressIn={() => {
        sc.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        sc.value = withSpring(1, { damping: 8, stiffness: 260 });
      }}
      onPress={() => {
        if (!silent) haptic.light();
        onPress?.();
      }}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}

/** Эмодзи, которое пульсирует (например, огонёк серии). */
export function PulseEmoji({ emoji, active = true, style }: { emoji: string; active?: boolean; style?: StyleProp<TextStyle> }) {
  const sc = useSharedValue(1);
  useEffect(() => {
    if (active) {
      sc.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      sc.value = withTiming(1);
    }
  }, [active]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return <Animated.Text style={[style, a]}>{emoji}</Animated.Text>;
}

/** Число, которое «накручивается» до нового значения. */
export function CountUp({ value, style, suffix = "" }: { value: number; style?: StyleProp<TextStyle>; suffix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    const diff = value - start;
    if (diff === 0) return;
    const t0 = Date.now();
    const dur = 900;
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + diff * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <Text style={style}>
      {shown}
      {suffix}
    </Text>
  );
}