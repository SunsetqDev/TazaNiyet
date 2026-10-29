import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { RANKS, getRank, getRankIndex } from "../lib/ranks";
import { C, S } from "../lib/theme";
import { CountUp } from "./anim";
import { LivingTree } from "./living-tree";
import { Mascot, MascotMood } from "./mascot";

type Props = {
  points: number;
  streak: number;
  /** сколько дней назад была последняя активность; null — заданий ещё не было */
  daysSince: number | null;
};

const QUIPS_HAPPY = ["Щекотно! 😄", "Ты молодец!", "Давай сделаем мир чище!", "Я тоже люблю баобабы 🌳", "Ещё одно задание? 😉"];
const QUIPS_SAD = ["Мне грустно… 🥺", "Сделай хотя бы одно задание?", "Баобабу нужна вода 💧"];

function healthFromDays(d: number | null) {
  if (d === null || d <= 1) return 0;
  if (d === 2) return 1;
  if (d <= 4) return 2;
  return 3;
}

export function PetCard({ points, streak, daysSince }: Props) {
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
      <View style={s.head}>
        <Text style={s.rank}>
          {rank.icon} {rank.name}
        </Text>
        <CountUp value={points} suffix=" TZ" style={s.pts} />
      </View>

      <View style={s.scene}>
        <View style={s.treeBox}>
          <LivingTree stage={stage} health={health} size={170} />
        </View>
        <View style={s.petBox}>
          <Animated.View key={shownMsg} entering={ZoomIn.springify().damping(12)} style={s.bubbleWrap}>
            <View style={s.bubble}>
              <Text style={s.bubbleText}>{shownMsg}</Text>
            </View>
            <View style={s.tail} />
          </Animated.View>
          <Mascot mood={mood} size={104} onTap={onTap} />
        </View>
      </View>

      <View style={s.bar}>
        <Animated.View style={[s.barFill, barStyle]} />
      </View>
      <Text style={s.next}>
        {next ? `До ранга «${RANKS[stage + 1].name}»: ещё ${next - points} TZ` : "Высший ранг! Ты хранитель степи 🦅"}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 30, padding: S.md, marginBottom: S.sm + 2 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rank: { fontSize: 16, fontWeight: "800", color: C.text },
  pts: { fontSize: 16, fontWeight: "800", color: C.sageDark },
  scene: { flexDirection: "row", alignItems: "flex-end", marginTop: S.xs },
  treeBox: { flex: 1, alignItems: "center" },
  petBox: { width: 128, alignItems: "center" },
  bubbleWrap: { alignItems: "center" },
  bubble: { backgroundColor: C.sageSoft, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleText: { color: C.text, fontSize: 12.5, lineHeight: 17, fontWeight: "600" },
  tail: { width: 14, height: 14, backgroundColor: C.sageSoft, transform: [{ rotate: "45deg" }], marginTop: -7, marginBottom: -2 },
  bar: { height: 8, backgroundColor: C.sageSoft, borderRadius: 4, marginTop: S.sm },
  barFill: { height: 8, backgroundColor: C.sage, borderRadius: 4 },
  next: { color: C.muted, fontSize: 12, marginTop: 8 },
});