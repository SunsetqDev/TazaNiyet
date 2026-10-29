import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { GrowTree } from "./grow-tree";

/** Баобаб, который покачивается на ветру и «выпрыгивает», когда вырастает на новую стадию. */
export function LivingTree({ stage, health, size = 170 }: { stage: number; health: number; size?: number }) {
  const rot = useSharedValue(0);
  const pop = useSharedValue(0.6);

  // ветер: больной баобаб качается слабее и медленнее
  useEffect(() => {
    const amp = health >= 2 ? 0.8 : 2.2;
    const dur = health >= 2 ? 3400 : 2200;
    rot.value = withRepeat(
      withSequence(
        withTiming(amp, { duration: dur, easing: Easing.inOut(Easing.quad) }),
        withTiming(-amp, { duration: dur, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [health]);

  // «вырастание»: при входе и при смене стадии
  useEffect(() => {
    pop.value = 0.75;
    pop.value = withSpring(1, { damping: 5, stiffness: 110 });
  }, [stage]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { scale: pop.value }],
  }));

  return (
    <Animated.View style={[{ transformOrigin: "50% 92%" }, style]}>
      <GrowTree stage={stage} health={health} size={size} />
    </Animated.View>
  );
}