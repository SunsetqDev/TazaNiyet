import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { C, R, S } from "../../lib/theme";

type Board = { display_name: string; place: string | null; total: number; is_me: boolean };

const RANKS = [
  { min: 0, icon: "🌱" },
  { min: 100, icon: "🌿" },
  { min: 500, icon: "🌳" },
  { min: 1500, icon: "🏔" },
  { min: 5000, icon: "🦅" },
];

function rankIcon(points: number) {
  let icon = RANKS[0].icon;
  for (const r of RANKS) if (points >= r.min) icon = r.icon;
  return icon;
}

const MEDALS = [
  { emoji: "🥇", color: "#F2C94C", height: 150 },
  { emoji: "🥈", color: "#C9CED6", height: 112 },
  { emoji: "🥉", color: "#D9A066", height: 88 },
];

function Avatar({ name, size, bg }: { name: string; size: number; bg: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.42, fontWeight: "800", color: C.text }}>
        {(name || "?").charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function PodiumSpot({ item, place }: { item?: Board; place: 0 | 1 | 2 }) {
  const m = MEDALS[place];
  if (!item) return <View style={s.podiumCol} />;
  return (
    <View style={s.podiumCol}>
      <Text style={s.medal}>{m.emoji}</Text>
      <Avatar name={item.display_name} size={place === 0 ? 64 : 54} bg={m.color} />
      <Text style={s.podiumName} numberOfLines={1}>
        {item.display_name}
        {item.is_me ? " (вы)" : ""}
      </Text>
      <View style={[s.pedestal, { height: m.height, backgroundColor: m.color }]}>
        <Text style={s.pedestalNum}>{place + 1}</Text>
        <Text style={s.pedestalPts}>{item.total} TZ</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [board, setBoard] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_leaderboard");
    setBoard((data as Board[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const myIndex = board.findIndex((r) => r.is_me);
  const me = myIndex >= 0 ? board[myIndex] : null;
  const above = myIndex > 0 ? board[myIndex - 1] : null;
  const gap = me && above ? Math.max(0, above.total - me.total) + 1 : 0;

  const rest = board.slice(3);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sageDark} />}
    >
      <View style={s.hero}>
        <Text style={s.heroLabel}>РЕЙТИНГ</Text>
        <Text style={s.heroTitle}>Лучшие участники 🏆</Text>
        {me ? (
          <View style={s.meBox}>
            <View style={{ flex: 1 }}>
              <Text style={s.meTitle}>Вы на {myIndex + 1} месте</Text>
              <Text style={s.meSub}>
                {myIndex === 0 ? "Вы лидер! Так держать 🔥" : `До ${myIndex} места осталось ${gap} TZ`}
              </Text>
            </View>
            <Text style={s.mePts}>{me.total} TZ</Text>
          </View>
        ) : (
          <Text style={s.heroSub}>Выполняйте задания и попадите в список</Text>
        )}
      </View>

      {loading && <ActivityIndicator color={C.sageDark} style={{ marginTop: S.md }} />}
      {!loading && board.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={{ fontSize: 44 }}>🌱</Text>
          <Text style={s.emptyTitle}>Пока никого</Text>
          <Text style={s.empty}>Выполните первое задание и станьте первым!</Text>
        </View>
      )}

      {board.length > 0 && (
        <View style={s.podium}>
          <PodiumSpot item={board[1]} place={1} />
          <PodiumSpot item={board[0]} place={0} />
          <PodiumSpot item={board[2]} place={2} />
        </View>
      )}

      {rest.length > 0 && <Text style={s.section}>Остальные участники</Text>}

      {rest.map((r, i) => (
        <View key={i} style={[s.row, r.is_me && s.rowMe]}>
          <Text style={s.pos}>{i + 4}</Text>
          <Avatar name={r.display_name} size={42} bg={r.is_me ? C.sage : C.sageLight} />
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>
              {r.display_name}
              {r.is_me ? " (вы)" : ""}
            </Text>
            {r.place ? (
              <Text style={s.place} numberOfLines={1}>
                📍 {r.place}
              </Text>
            ) : null}
          </View>
          <View style={s.ptsBox}>
            <Text style={s.pts}>
              {rankIcon(r.total)} {r.total}
            </Text>
            <Text style={s.ptsLabel}>TZ</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 60, paddingBottom: S.xl + 30 },

  hero: { backgroundColor: C.sage, borderRadius: 30, padding: S.lg, marginBottom: S.lg },
  heroLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: C.text, opacity: 0.6 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: C.text, marginTop: 6 },
  heroSub: { color: C.text, opacity: 0.75, marginTop: S.sm },
  meBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: R.card, padding: S.md - 4, marginTop: S.md },
  meTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  meSub: { color: C.muted, marginTop: 3, fontSize: 13 },
  mePts: { fontSize: 22, fontWeight: "800", color: C.sageDark },

  podium: { flexDirection: "row", alignItems: "flex-end", gap: S.sm, marginBottom: S.lg, marginTop: S.sm },
  podiumCol: { flex: 1, alignItems: "center" },
  medal: { fontSize: 26, marginBottom: 4 },
  podiumName: { fontSize: 13, fontWeight: "700", color: C.text, marginTop: 6, marginBottom: 8, maxWidth: "100%" },
  pedestal: { width: "100%", borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: "center", justifyContent: "center", paddingVertical: S.sm },
  pedestalNum: { fontSize: 34, fontWeight: "900", color: C.text, opacity: 0.85 },
  pedestalPts: { fontSize: 13, fontWeight: "800", color: C.text, opacity: 0.75, marginTop: 2 },

  section: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: S.md },
  row: { flexDirection: "row", alignItems: "center", gap: S.sm + 2, backgroundColor: C.card, borderRadius: R.card, padding: S.sm + 2, paddingRight: S.md - 4, marginBottom: S.sm },
  rowMe: { backgroundColor: C.sageSoft, borderWidth: 2, borderColor: C.sage },
  pos: { width: 26, textAlign: "center", fontWeight: "800", color: C.muted, fontSize: 15 },
  name: { fontSize: 16, fontWeight: "700", color: C.text },
  place: { fontSize: 12, color: C.muted, marginTop: 2 },
  ptsBox: { alignItems: "flex-end" },
  pts: { fontWeight: "800", color: C.sageDark, fontSize: 16 },
  ptsLabel: { fontSize: 11, color: C.muted, fontWeight: "700" },

  emptyBox: { alignItems: "center", backgroundColor: C.card, borderRadius: R.card, padding: S.lg, marginBottom: S.md },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: S.sm },
  empty: { color: C.muted, marginTop: 4, textAlign: "center" },
});