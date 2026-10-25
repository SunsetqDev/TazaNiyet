import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { C, R, S } from "../../lib/theme";

type Board = { display_name: string; place: string | null; total: number; is_me: boolean };

export default function LeaderboardScreen() {
  const [board, setBoard] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const { data } = await supabase.rpc("get_leaderboard");
        setBoard((data as Board[]) ?? []);
        setLoading(false);
      };
      load();
    }, [])
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Рейтинг</Text>
      <Text style={s.sub}>Лучшие участники по очкам TZ</Text>

      {loading && <ActivityIndicator color={C.sageDark} />}
      {!loading && board.length === 0 && <Text style={s.empty}>Пока никого. Станьте первым!</Text>}

      {board.map((r, i) => (
        <View key={i} style={[s.row, r.is_me && s.rowMe]}>
          <View style={[s.pos, i < 3 && s.posTop]}>
            <Text style={[s.posText, i < 3 && { color: C.text }]}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>
              {r.display_name}
              {r.is_me ? " (вы)" : ""}
            </Text>
            {r.place ? <Text style={s.place}>{r.place}</Text> : null}
          </View>
          <Text style={s.pts}>{r.total} TZ</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 70, paddingBottom: S.xl + 20 },
  title: { fontSize: 30, fontWeight: "700", color: C.text },
  sub: { color: C.muted, marginTop: 6, marginBottom: S.lg },
  empty: { color: C.muted },
  row: { flexDirection: "row", alignItems: "center", gap: S.md - 4, backgroundColor: C.card, borderRadius: R.card, padding: S.md - 4, marginBottom: S.sm },
  rowMe: { backgroundColor: C.sageSoft },
  pos: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  posTop: { backgroundColor: C.sage },
  posText: { fontWeight: "700", color: C.muted },
  name: { fontSize: 16, fontWeight: "600", color: C.text },
  place: { fontSize: 12, color: C.muted, marginTop: 2 },
  pts: { fontWeight: "800", color: C.sageDark },
});