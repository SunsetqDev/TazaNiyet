import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

const COLORS = ["#F2C94C", "#6FA85B", "#9CC5E8", "#F4A6A6", "#C9B3E8", "#F2B880"];

function Piece({ i, w, h }: { i: number; w: number; h: number }) {
  const y = useSharedValue(-30);
  const rot = useSharedValue(0);
  const drift = useSharedValue(0);

  const cfg = useMemo(
    () => ({
      x: Math.random() * w,
      size: 8 + Math.random() * 8,
      delay: Math.random() * 500,
      dur: 1900 + Math.random() * 1500,
      spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720),
      drift: (Math.random() - 0.5) * 90,
      round: Math.random() > 0.6,
      color: COLORS[i % COLORS.length],
    }),
    []
  );

  useEffect(() => {
    y.value = withDelay(cfg.delay, withTiming(h + 40, { duration: cfg.dur, easing: Easing.in(Easing.quad) }));
    rot.value = withDelay(cfg.delay, withTiming(cfg.spin, { duration: cfg.dur }));
    drift.value = withDelay(cfg.delay, withTiming(cfg.drift, { duration: cfg.dur }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }, { translateY: y.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: cfg.x,
          top: 0,
          width: cfg.size,
          height: cfg.round ? cfg.size : cfg.size * 1.6,
          borderRadius: cfg.round ? cfg.size / 2 : 2,
          backgroundColor: cfg.color,
        },
        style,
      ]}
    />
  );
}

/** Салют из конфетти на весь экран. */
export function Confetti({ count = 42 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={i} i={i} w={width} h={height} />
      ))}
    </View>
  );
}