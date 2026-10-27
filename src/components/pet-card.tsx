import { StyleSheet, Text, View } from "react-native";
import { RANKS, getRank, getRankIndex } from "../lib/ranks";
import { C, S } from "../lib/theme";
import { GrowTree } from "./grow-tree";
import { Mascot, MascotMood } from "./mascot";

type Props = {
  points: number;
  streak: number;
  /** сколько дней назад была последняя активность; null — заданий ещё не было */
  daysSince: number | null;
};

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

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.rank}>
          {rank.icon} {rank.name}
        </Text>
        <Text style={s.pts}>{points} TZ</Text>
      </View>

      <View style={s.scene}>
        <View style={s.treeBox}>
          <GrowTree stage={stage} health={health} size={170} />
        </View>
        <View style={s.petBox}>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>{msg}</Text>
          </View>
          <View style={s.tail} />
          <Mascot mood={mood} size={104} />
        </View>
      </View>

      <View style={s.bar}>
        <View style={[s.barFill, { width: `${progress}%` }]} />
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
  bubble: { backgroundColor: C.sageSoft, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleText: { color: C.text, fontSize: 12.5, lineHeight: 17, fontWeight: "600" },
  tail: { width: 14, height: 14, backgroundColor: C.sageSoft, transform: [{ rotate: "45deg" }], marginTop: -7, marginBottom: -2 },
  bar: { height: 8, backgroundColor: C.sageSoft, borderRadius: 4, marginTop: S.sm },
  barFill: { height: 8, backgroundColor: C.sage, borderRadius: 4 },
  next: { color: C.muted, fontSize: 12, marginTop: 8 },
});