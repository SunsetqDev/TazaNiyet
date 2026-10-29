import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { RANKS, getRank, getRankIndex } from "../lib/ranks";
import { color, font, radius, space, type } from "../lib/theme";
import { CountUp } from "./anim";
import { LivingTree } from "./living-tree";
import { Mascot, MascotMood } from "./mascot";
import { AppText } from "./ui/app-text";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  points: number;
  streak: number;
  /** сколько дней назад была последняя активность; null — заданий ещё не было */
  daysSince: number | null;
  /** принятых заявок */
  approved: number;
  /** заявок на проверке */
  pending: number;
};

const QUIPS_HAPPY = ["Щекотно! 😄", "Ты молодец!", "Давай сделаем мир чище!", "Я тоже люблю баобабы 🌳", "Ещё одно задание? 😉"];
const QUIPS_SAD = ["Мне грустно… 🥺", "Сделай хотя бы одно задание?", "Баобабу нужна вода 💧"];

function healthFromDays(d: number | null) {
  if (d === null || d <= 1) return 0;
  if (d === 2) return 1;
  if (d <= 4) return 2;
  return 3;
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={s.stat}>
      <View style={s.statTop}>
        <Ionicons name={icon} size={16} color={color.lime} />
        <CountUp value={value} style={s.statNum} />
      </View>
      <AppText variant="caption" color={color.onForestMuted}>
        {label}
      </AppText>
    </View>
  );
}

/** Главная карточка: ранг, очки, баобаб с Барсом, прогресс до следующего ранга и личная статистика. */
export function PetCard({ points, streak, daysSince, approved, pending }: Props) {
  const rank = getRank(points);
  const stage = getRankIndex(points);
  const health = healthFromDays(daysSince);
  const next = rank.next;
  const progress = next ? Math.min(100, ((points - rank.min) / (next - rank.min)) * 100) : 100;

  const [quip, setQuip] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  // полоска прогресса плавно заполняется
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(progress, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  let mood: MascotMood = "happy";
  let msg = "";
  if (daysSince === null) {
    msg = "Привет! Я Барс. Выполни первое задание, и твой росток пойдёт в рост 🌱";
  } else if (health === 0) {
    mood = streak >= 3 ? "cheer" : "happy";
    msg = streak >= 3 ? `${streak} дн. подряд! Баобаб в восторге 🔥` : "Баобаб доволен. Так держать!";
  } else if (health === 1) {
    msg = "Баобабу немного грустно. Сделай задание сегодня!";
  } else if (health === 2) {
    mood = "sad";
    msg = "Листья вянут… Баобаб скучает по тебе";
  } else {
    mood = "sad";
    msg = "Баобаб совсем завял. Одно задание, и он оживёт!";
  }

  const onTap = () => {
    const list = mood === "sad" ? QUIPS_SAD : QUIPS_HAPPY;
    setQuip(list[Math.floor(Math.random() * list.length)]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setQuip(null), 3500);
  };

  const shownMsg = quip ?? msg;

  return (
    <View style={s.card}>
      <AppText variant="overline" color={color.lime}>
        Ранг · {rank.name}
      </AppText>
      <View style={s.ptsRow}>
        <CountUp value={points} style={s.pts} />
        <AppText style={s.ptsUnit} color={color.onForestMuted}>
          TZ
        </AppText>
      </View>

      <View style={s.scene}>
        <View style={s.treeBox}>
          <LivingTree stage={stage} health={health} size={140} />
        </View>
        <View style={s.petBox}>
          <Animated.View key={shownMsg} entering={ZoomIn.springify().damping(12)} style={s.bubbleWrap}>
            <View style={s.bubble}>
              <AppText style={s.bubbleText}>{shownMsg}</AppText>
            </View>
            <View style={s.tail} />
          </Animated.View>
          <Mascot mood={mood} size={92} onTap={onTap} />
        </View>
      </View>

      <View style={s.bar}>
        <Animated.View style={[s.barFill, barStyle]} />
      </View>
      <AppText variant="caption" color={color.onForestMuted} style={{ marginTop: space.x2 }}>
        {next ? `Ещё ${next - points} TZ до ранга «${RANKS[stage + 1].name}»` : "Высший ранг — ты хранитель степи"}
      </AppText>

      <View style={s.stats}>
        <Stat icon="flame" value={streak} label="дней подряд" />
        <Stat icon="checkmark-circle" value={approved} label="принято" />
        <Stat icon="hourglass-outline" value={pending} label="на проверке" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: color.forest, borderRadius: radius.hero, padding: space.x5 },
  ptsRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: space.x2 },
  pts: { ...type.display, fontSize: 44, lineHeight: 50, color: color.onForest },
  ptsUnit: { fontFamily: font.semibold, fontSize: 16 },
  scene: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: space.x4,
    backgroundColor: color.moss,
    borderRadius: 22,
    paddingTop: space.x3,
    paddingHorizontal: space.x2,
    overflow: "hidden",
  },
  treeBox: { flex: 1, alignItems: "center" },
  petBox: { width: 132, alignItems: "center" },
  bubbleWrap: { alignItems: "center" },
  bubble: { backgroundColor: color.cream, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleText: { fontFamily: font.medium, color: color.ink, fontSize: 12.5, lineHeight: 17 },
  tail: { width: 12, height: 12, backgroundColor: color.cream, transform: [{ rotate: "45deg" }], marginTop: -6, marginBottom: -2 },
  bar: { height: 6, backgroundColor: color.mossLine, borderRadius: 3, marginTop: space.x4, overflow: "hidden" },
  barFill: { height: 6, backgroundColor: color.lime, borderRadius: 3 },
  stats: { flexDirection: "row", gap: space.x2, marginTop: space.x4 },
  stat: { flex: 1, backgroundColor: color.moss, borderRadius: 16, paddingVertical: space.x3 - 2, paddingHorizontal: space.x3 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNum: { fontFamily: font.bold, fontSize: 18, lineHeight: 22, color: color.onForest },
});
