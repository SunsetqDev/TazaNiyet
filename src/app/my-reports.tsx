import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, RefreshControl, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { EmptyState, ErrorState } from "../components/ui/empty-state";
import { Screen } from "../components/ui/screen";
import { Skeleton } from "../components/ui/skeleton";
import { StatusPill } from "../components/ui/status-pill";
import { reportCategory } from "../lib/reports";
import { supabase } from "../lib/supabase";
import { color, radius, space } from "../lib/theme";

type Row = {
  id: number;
  category: string;
  description: string;
  photo_paths: string[];
  address: string | null;
  status: string;
  reject_reason: string | null;
  created_at: string;
};

export default function MyReportsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data, error } = await supabase
      .from("reports")
      .select("id, category, description, photo_paths, address, status, reject_reason, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(true);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Row[];
    setRows(list);
    // миниатюра — первое фото каждой заявки; ссылки временные (бакет закрытый)
    const firsts = list.map((r) => r.photo_paths[0]).filter(Boolean);
    if (firsts.length > 0) {
      const { data: signed } = await supabase.storage.from("reports").createSignedUrls(firsts, 3600);
      const map: Record<string, string> = {};
      for (const x of signed ?? []) if (x.path && x.signedUrl) map[x.path] = x.signedUrl;
      setThumbs(map);
    }
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

  return (
    <Screen
      bottomInset
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.forest]} tintColor={color.forest} />}
    >
      <BackButton />
      <AppText variant="h1">Мои заявки</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x5 }}>
        Места, о которых вы сообщили. Подтверждённые становятся заданиями на карте.
      </AppText>

      {loading && (
        <View style={{ gap: space.x3 }}>
          <Skeleton height={96} round={radius.card} />
          <Skeleton height={96} round={radius.card} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="camera-outline"
          title="Вы ещё не сообщали о загрязнении"
          text="Заметили мусор или свалку? Сфотографируйте место — после проверки его уберут другие участники."
          action="Сообщить о загрязнении"
          onAction={() => router.push("/report")}
        />
      )}

      {!loading &&
        !error &&
        rows.map((r) => {
          const cat = reportCategory(r.category);
          const thumb = thumbs[r.photo_paths[0]];
          return (
            <View key={r.id} style={s.item}>
              <View style={s.top}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={s.thumb} />
                ) : (
                  <View style={[s.thumb, s.noThumb]}>
                    <Ionicons name={cat.icon} size={22} color={color.muted} />
                  </View>
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="bodyStrong">{cat.label}</AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {[r.address, new Date(r.created_at).toLocaleDateString("ru-RU")].filter(Boolean).join(" · ")}
                  </AppText>
                  <StatusPill status={r.status} />
                </View>
              </View>
              <AppText variant="body" color={color.ink} numberOfLines={3} style={{ marginTop: space.x3 }}>
                {r.description}
              </AppText>
              {r.status === "rejected" && r.reject_reason ? (
                <View style={s.reason}>
                  <Ionicons name="information-circle-outline" size={18} color={color.danger} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" color={color.danger}>
                      Почему отклонено
                    </AppText>
                    <AppText variant="body" color={color.ink}>
                      {r.reject_reason}
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

      {!loading && !error && rows.length > 0 && (
        <Button label="Сообщить ещё" icon="add" variant="secondary" onPress={() => router.push("/report")} style={{ marginTop: space.x2 }} />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  item: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x4,
    marginBottom: space.x3,
  },
  top: { flexDirection: "row", gap: space.x3, alignItems: "flex-start" },
  thumb: { width: 64, height: 64, borderRadius: 16, backgroundColor: color.sand },
  noThumb: { alignItems: "center", justifyContent: "center" },
  reason: {
    flexDirection: "row",
    gap: space.x2,
    backgroundColor: color.dangerSoft,
    borderRadius: 16,
    padding: space.x3,
    marginTop: space.x3,
  },
});
