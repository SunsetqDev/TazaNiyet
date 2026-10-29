import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { haptic } from "../lib/haptics";

export type MascotMood = "happy" | "sad" | "cheer";

const FUR = "#C9D5DF";
const FUR_D = "#8FA0B0";
const CREAM = "#F4F7F9";
const SPOT = "#7C8B9A";
const DARK = "#2F3A45";
const PINK = "#EFA3B0";
const GREEN = "#6FA85B";
const GREEN_D = "#4F8A45";

const star = (x: number, y: number, s: number) =>
  `M${x} ${y - 9 * s} L${x + 2.5 * s} ${y - 2.5 * s} L${x + 9 * s} ${y} L${x + 2.5 * s} ${y + 2.5 * s} L${x} ${y + 9 * s} L${x - 2.5 * s} ${y + 2.5 * s} L${x - 9 * s} ${y} L${x - 2.5 * s} ${y - 2.5 * s}Z`;

function Eyes({ py }: { py: number }) {
  return (
    <>
      <Ellipse cx={74} cy={92} rx={13} ry={15} fill="#FFFFFF" />
      <Ellipse cx={126} cy={92} rx={13} ry={15} fill="#FFFFFF" />
      <Circle cx={75} cy={py} r={8.5} fill={DARK} />
      <Circle cx={125} cy={py} r={8.5} fill={DARK} />
      <Circle cx={78} cy={py - 3} r={3} fill="#FFFFFF" />
      <Circle cx={128} cy={py - 3} r={3} fill="#FFFFFF" />
    </>
  );
}

/** Только глаза: лежат поверх лица и сплющиваются при моргании. */
function EyesOverlay({ mood, size }: { mood: MascotMood; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 6 200 200">
      <Eyes py={mood === "sad" ? 96 : 93} />
    </Svg>
  );
}

/** Барс — снежный барс, лицо приложения. Рисуется векторно, без картинок. */
export function MascotArt({ mood = "happy", size = 120, hideEyes = false }: { mood?: MascotMood; size?: number; hideEyes?: boolean }) {
  const sad = mood === "sad";
  const cheer = mood === "cheer";
  const py = sad ? 96 : 93;

  return (
    <Svg width={size} height={size} viewBox="0 6 200 200">
      {/* тело */}
      <Ellipse cx={100} cy={178} rx={50} ry={26} fill={FUR} stroke={FUR_D} strokeWidth={3} />
      <Ellipse cx={100} cy={184} rx={28} ry={16} fill={CREAM} />
      <Ellipse cx={64} cy={172} rx={7} ry={4.5} fill={SPOT} rotation={-20} origin="64, 172" />
      <Ellipse cx={138} cy={170} rx={7} ry={4.5} fill={SPOT} rotation={15} origin="138, 170" />
      <Ellipse cx={60} cy={186} rx={6} ry={4} fill={SPOT} />
      <Ellipse cx={142} cy={185} rx={6} ry={4} fill={SPOT} />

      {/* уши */}
      <G rotation={sad ? -24 : 0} origin="62, 62">
        <Path d="M38 76 Q30 26 68 38 Q88 46 94 62 Z" fill={FUR} stroke={FUR_D} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M49 66 Q46 42 66 48 Q77 52 80 60 Z" fill={PINK} />
      </G>
      <G rotation={sad ? 24 : 0} origin="138, 62">
        <Path d="M162 76 Q170 26 132 38 Q112 46 106 62 Z" fill={FUR} stroke={FUR_D} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M151 66 Q154 42 134 48 Q123 52 120 60 Z" fill={PINK} />
      </G>

      {/* голова */}
      <Ellipse cx={100} cy={102} rx={68} ry={58} fill={FUR} stroke={FUR_D} strokeWidth={3} />
      <Ellipse cx={80} cy={62} rx={6} ry={3} fill={SPOT} rotation={-25} origin="80, 62" />
      <Ellipse cx={120} cy={62} rx={6} ry={3} fill={SPOT} rotation={25} origin="120, 62" />
      <Ellipse cx={44} cy={96} rx={3.5} ry={6} fill={SPOT} rotation={-15} origin="44, 96" />
      <Ellipse cx={156} cy={96} rx={3.5} ry={6} fill={SPOT} rotation={15} origin="156, 96" />

      {/* росток на макушке */}
      <Path d="M100 46 Q100 38 100 32" stroke={GREEN_D} strokeWidth={5} strokeLinecap="round" fill="none" />
      <G rotation={sad ? -55 : 0} origin="100, 34">
        <Path d="M100 36 Q84 16 64 26 Q80 44 100 36Z" fill={GREEN} stroke={GREEN_D} strokeWidth={2.5} strokeLinejoin="round" />
      </G>
      <G rotation={sad ? 55 : 0} origin="100, 34">
        <Path d="M100 36 Q116 16 136 26 Q120 44 100 36Z" fill={GREEN} stroke={GREEN_D} strokeWidth={2.5} strokeLinejoin="round" />
      </G>

      {/* глаза */}
      {cheer ? (
        <>
          <Path d="M62 94 Q74 78 86 94" stroke={DARK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M114 94 Q126 78 138 94" stroke={DARK} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      ) : hideEyes ? null : (
        <Eyes py={py} />
      )}
      {sad && (
        <>
          <Path d="M58 78 L90 68" stroke={DARK} strokeWidth={4} strokeLinecap="round" />
          <Path d="M142 78 L110 68" stroke={DARK} strokeWidth={4} strokeLinecap="round" />
        </>
      )}

      {/* щёки, мордочка */}
      <Circle cx={52} cy={114} r={9} fill="#F4A6A6" opacity={0.55} />
      <Circle cx={148} cy={114} r={9} fill="#F4A6A6" opacity={0.55} />
      <Ellipse cx={100} cy={124} rx={32} ry={20} fill={CREAM} />
      <Path d="M92 109 Q100 104 108 109 Q105 120 100 121 Q95 120 92 109Z" fill={PINK} stroke="#D27B8B" strokeWidth={2} strokeLinejoin="round" />
      {sad && <Path d="M64 110 Q58 121 64 127 Q71 121 64 110Z" fill="#8EC9F0" stroke="#5FA8DC" strokeWidth={1.5} />}

      {/* рот */}
      <Path d="M100 120 L100 125" stroke={DARK} strokeWidth={3} strokeLinecap="round" />
      {cheer ? (
        <>
          <Path d="M84 126 Q100 158 116 126 Q100 130 84 126Z" fill="#8A3F33" stroke={DARK} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M93 144 Q100 139 107 144 Q100 152 93 144Z" fill="#E8837A" />
        </>
      ) : sad ? (
        <Path d="M88 138 Q100 127 112 138" stroke={DARK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <Path d="M100 125 Q93 134 85 127" stroke={DARK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <Path d="M100 125 Q107 134 115 127" stroke={DARK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      )}

      {/* усы */}
      <Path d="M72 120 L44 114 M72 127 L44 130 M128 120 L156 114 M128 127 L156 130" stroke="#9AA7B3" strokeWidth={2} strokeLinecap="round" />

      {/* блёстки радости */}
      {cheer && (
        <>
          <Path d={star(24, 44, 1)} fill="#F2C94C" />
          <Path d={star(178, 38, 1.2)} fill="#F2C94C" />
          <Path d={star(172, 128, 0.8)} fill="#F2C94C" />
        </>
      )}
    </Svg>
  );
}

/**
 * Живой Барс: дышит, моргает, прыгает от радости и подпрыгивает, если на него нажать.
 */
export function Mascot({ mood = "happy", size = 120, onTap }: { mood?: MascotMood; size?: number; onTap?: () => void }) {
  const bob = useSharedValue(0);
  const jump = useSharedValue(0);
  const squish = useSharedValue(1);
  const blink = useSharedValue(1);

  // дыхание: весёлый прыгает, грустный еле двигается
  useEffect(() => {
    const amp = mood === "cheer" ? -10 : mood === "sad" ? -2 : -5;
    const dur = mood === "cheer" ? 380 : mood === "sad" ? 1600 : 1000;
    bob.value = withRepeat(
      withSequence(
        withTiming(amp, { duration: dur, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: dur, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [mood]);

  // моргание раз в несколько секунд
  useEffect(() => {
    blink.value = withRepeat(
      withSequence(withDelay(3200, withTiming(0.08, { duration: 90 })), withTiming(1, { duration: 120 })),
      -1,
      false
    );
  }, []);

  const hop = () => {
    jump.value = withSequence(withTiming(-26, { duration: 150, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 180 }));
    squish.value = withSequence(withTiming(0.88, { duration: 90 }), withTiming(1.08, { duration: 140 }), withSpring(1, { damping: 8 }));
  };

  // при смене настроения Барс коротко подпрыгивает
  useEffect(() => {
    hop();
  }, [mood]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value + jump.value }, { scaleY: squish.value }, { scaleX: 2 - squish.value }],
  }));
  const blinkStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  return (
    <Pressable
      onPress={() => {
        haptic.light();
        hop();
        onTap?.();
      }}
    >
      <Animated.View style={[{ width: size, height: size, transformOrigin: "50% 100%" }, bodyStyle]}>
        <MascotArt mood={mood} size={size} hideEyes={mood !== "cheer"} />
        {mood !== "cheer" && (
          <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: "50% 43%" }, blinkStyle]}>
            <EyesOverlay mood={mood} size={size} />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}