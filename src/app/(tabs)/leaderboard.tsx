import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../components/avatar";
import { AppText } from "../../components/ui/app-text";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton, SkeletonCard } from "../../components/ui/skeleton";
import { getRank } from "../../lib/ranks";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";

type Board = { display_name: string; place: string | null; total: number; is_me: boolean };

// пьедестал: 1-е место — тёмно-зелёное, 2-е и 3-е — песочные
const PODIUM = [
  { height: 104, bg: color.forest, fg: color.lime },
  { height: 80, bg: color.sand, fg: color.ink },
  { height: 64, bg: color.sand, fg: color.ink },
];

function PodiumSpot({ item, place }: { item?: Board; place: 0 | 1 | 2 }) {
  const p = PODIUM[place];
  if (!item) return <View style={s.podiumCol} />;
  return (
    <View style={s.podiumCol}>
      <View style={[s.podiumAvatar, item.is_me && s.meRing]}>
        <Avatar name={item.display_name} size={place === 0 ? 60 : 50} color={place === 0 ? color.lime : color.surface} />
      </View>
      <AppText style={s.podiumName} numberOfLines={1}>
        {item.display_name}
        {item.is_me ? " (вы)" : ""}
      </AppText>
      <AppText variant="caption">{item.total} TZ</AppText>
      <View style={[s.pedestal, { height: p.height, backgroundColor: p.bg }]}>
        <AppText style={[s.pedestalNum, { color: p.fg }]}>{place + 1}</AppText>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [board, setBoard] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_leaderboard");
    setError(!!error);
    if (!error) setBoard((data as Board[]) ?? []);
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
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.forest]} tintColor={color.forest} />}
    >
      <AppText variant="h1">Рейтинг</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x5 }}>
        Лучшие участники по очкам TZ
      </AppText>

      {loading ? (
        <SkeletonCard height={96} style={{ borderRadius: radius.hero }} />
      ) : (
        <View style={s.hero}>
          {me ? (
            <>
              <AppText variant="overline" color={color.lime}>
                Ваше место
              </AppText>
              <View style={s.heroRow}>
                <AppText style={s.heroPlace}>{myIndex + 1}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" color={color.onForest}>
                    {me.total} TZ
                  </AppText>
                  <AppText variant="caption" color={color.onForestMuted}>
                    {myIndex === 0 ? "Вы лидер — так держать" : `До ${myIndex} места осталось ${gap} TZ`}
                  </AppText>
                </View>
              </View>
            </>
          ) : (
            <>
              <AppText variant="h3" color={color.onForest}>
                Вас пока нет в рейтинге
              </AppText>
              <AppText variant="caption" color={color.onForestMuted} style={{ marginTop: 4 }}>
                Выполните задание — после проверки вы появитесь в списке.
              </AppText>
            </>
          )}
        </View>
      )}

      {loading && (
        <View style={{ gap: space.x3, marginTop: space.x6 }}>
          <Skeleton height={160} round={radius.card} />
          <Skeleton height={56} round={12} />
          <Skeleton height={56} round={12} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && board.length === 0 && (
        <EmptyState icon="trophy-outline" title="Пока никого" text="Выполните первое задание и станьте первым в рейтинге." />
      )}

      {!loading && !error && board.length > 0 && (
        <View style={s.podium}>
          <PodiumSpot item={board[1]} place={1} />
          <PodiumSpot item={board[0]} place={0} />
          <PodiumSpot item={board[2]} place={2} />
        </View>
      )}

      {!loading && !error && rest.length > 0 && (
        <>
          <SectionHeader title="Остальные участники" />
          <View style={s.list}>
            {rest.map((r, i) => (
              <View key={i} style={[s.row, i > 0 && s.rowLine, r.is_me && s.rowMe]}>
                <AppText style={s.pos}>{i + 4}</AppText>
                <Avatar name={r.display_name} size={40} color={r.is_me ? color.lime : color.sand} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {r.display_name}
                    {r.is_me ? " (вы)" : ""}
                  </AppText>
                  {r.place ? (
                    <AppText variant="caption" numberOfLines={1}>
                      {r.place}
                    </AppText>
                  ) : null}
                </View>
                <View style={s.ptsBox}>
                  <AppText style={s.pts}>
                    <Text>{getRank(r.total).icon}</Text> {r.total}
                  </AppText>
                  <AppText variant="caption">TZ</AppText>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: color.forest, borderRadius: radius.hero, padding: space.x5 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: space.x4, marginTop: space.x2 },
  heroPlace: { fontFamily: font.display, fontSize: 48, lineHeight: 54, color: color.onForest },
  podium: { flexDirection: "row", alignItems: "flex-end", gap: space.x2, marginTop: space.x6 },
  podiumCol: { flex: 1, alignItems: "center" },
  podiumAvatar: { borderRadius: 40, padding: 2, borderWidth: 2, borderColor: "transparent" },
  meRing: { borderColor: color.forest },
  podiumName: { fontFamily: font.semibold, fontSize: 13, color: color.ink, marginTop: space.x2, maxWidth: "100%" },
  pedestal: {
    width: "100%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    alignItems: "center",
    paddingTop: space.x2,
    marginTop: space.x2,
  },
  pedestalNum: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  list: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, paddingVertical: space.x3, paddingHorizontal: space.x4 },
  rowLine: { borderTopWidth: 1, borderTopColor: color.line },
  rowMe: { backgroundColor: color.limeSoft },
  pos: { width: 24, fontFamily: font.bold, fontSize: 15, color: color.muted, textAlign: "center" },
  ptsBox: { alignItems: "flex-end" },
  pts: { fontFamily: font.bold, fontSize: 15, color: color.ink },
});
