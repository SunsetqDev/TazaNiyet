import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { AppText } from "../../components/ui/app-text";
import { BackButton } from "../../components/ui/back-button";
import { Button } from "../../components/ui/button";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton, SkeletonCard } from "../../components/ui/skeleton";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";
import { uniPrograms, uniTypeLabel, type Uni } from "../../lib/universities";

/** Подробная информация о вузе. Данные — та же таблица universities, по id. */
export default function UniversityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [u, setU] = useState<Uni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase.from("universities").select("*").eq("id", Number(id)).maybeSingle();
    setError(!!error);
    setU((data as Uni) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const programs = u ? uniPrograms(u) : [];

  return (
    <Screen
      bottomInset
      footer={
        u?.website ? <Button label="Открыть сайт" icon="open-outline" onPress={() => Linking.openURL(u.website!)} /> : undefined
      }
    >
      <BackButton />

      {loading && (
        <View style={{ gap: space.x3 }}>
          <SkeletonCard height={200} />
          <Skeleton width="80%" height={28} />
          <Skeleton width="40%" height={14} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && !u && (
        <EmptyState icon="school-outline" title="Вуз не найден" text="Возможно, его убрали из каталога." />
      )}

      {!loading && u && (
        <>
          {u.photo_url ? (
            <Image source={{ uri: u.photo_url }} style={s.photo} resizeMode="cover" />
          ) : (
            <View style={[s.photo, s.placeholder]}>
              <Ionicons name={u.type === "college" ? "business-outline" : "school-outline"} size={48} color={color.muted} />
            </View>
          )}
          {u.photo_url && u.photo_credit ? (
            <AppText variant="caption" color={color.faint} style={{ marginTop: 6 }}>
              Фото: {u.photo_credit}
            </AppText>
          ) : null}

          <View style={s.typePill}>
            <AppText style={s.typeText}>{uniTypeLabel(u.type)}</AppText>
          </View>
          <AppText variant="h1" style={{ marginTop: space.x2 }}>
            {u.name}
          </AppText>
          <View style={s.cityRow}>
            <Ionicons name="location-outline" size={16} color={color.muted} />
            <AppText variant="body" color={color.muted}>
              {u.city}
            </AppText>
          </View>

          {u.description ? (
            <>
              <SectionHeader title="О вузе" />
              <AppText variant="body" color={color.ink}>
                {u.description}
              </AppText>
            </>
          ) : null}

          {u.requirements ? (
            <>
              <SectionHeader title="Как поступить" />
              <View style={s.req}>
                <Ionicons name="school-outline" size={20} color={color.forest} />
                <AppText variant="body" color={color.ink} style={{ flex: 1 }}>
                  {u.requirements}
                </AppText>
              </View>
            </>
          ) : null}

          {programs.length > 0 && (
            <>
              <SectionHeader title="Направления" hint={String(programs.length)} />
              <View style={s.tags}>
                {programs.map((p) => (
                  <View key={p} style={s.tag}>
                    <AppText style={s.tagText}>{p}</AppText>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={s.checked}>
            <Ionicons name="information-circle-outline" size={16} color={color.muted} />
            <AppText variant="caption" style={{ flex: 1 }}>
              {u.checked_at
                ? `Данные проверены: ${new Date(u.checked_at).toLocaleDateString("ru-RU")}. Точные сроки и условия уточняйте на официальном сайте.`
                : "Актуальные данные уточняйте на официальном сайте."}
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  photo: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.card },
  placeholder: { backgroundColor: color.sand, alignItems: "center", justifyContent: "center" },
  typePill: {
    alignSelf: "flex-start",
    backgroundColor: color.limeSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 5,
    marginTop: space.x4,
  },
  typeText: { fontFamily: font.semibold, fontSize: 12, color: color.forest },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: space.x1 },
  req: { flexDirection: "row", gap: space.x3, backgroundColor: color.limeSoft, borderRadius: radius.card, padding: space.x4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: space.x2 },
  tag: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.pill, paddingHorizontal: space.x3, paddingVertical: 7 },
  tagText: { fontFamily: font.medium, fontSize: 13, color: color.ink },
  checked: {
    flexDirection: "row",
    gap: space.x2,
    backgroundColor: color.sand,
    borderRadius: 16,
    padding: space.x3,
    marginTop: space.x6,
  },
});
