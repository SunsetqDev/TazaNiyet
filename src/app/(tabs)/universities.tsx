import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { PressScale } from "../../components/anim";
import { AppText } from "../../components/ui/app-text";
import { Chip } from "../../components/ui/chip";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { SkeletonCard } from "../../components/ui/skeleton";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";
import { uniPrograms, uniTypeLabel, type Uni } from "../../lib/universities";

function UniCard({ u, onPress }: { u: Uni; onPress: () => void }) {
  const programs = uniPrograms(u);
  return (
    <PressScale onPress={onPress} scaleTo={0.98} style={s.card}>
      {u.photo_url ? (
        <Image source={{ uri: u.photo_url }} style={s.photo} resizeMode="cover" />
      ) : (
        <View style={[s.photo, s.placeholder]}>
          <Ionicons name={u.type === "college" ? "business-outline" : "school-outline"} size={36} color={color.muted} />
        </View>
      )}
      <View style={s.badge}>
        <AppText style={s.badgeText}>{uniTypeLabel(u.type)}</AppText>
      </View>
      <View style={s.body}>
        <AppText variant="h3">{u.name}</AppText>
        <View style={s.cityRow}>
          <Ionicons name="location-outline" size={14} color={color.muted} />
          <AppText variant="caption">{u.city}</AppText>
        </View>
        {programs.length > 0 && (
          <View style={s.tags}>
            {programs.slice(0, 3).map((p) => (
              <View key={p} style={s.tag}>
                <AppText style={s.tagText} numberOfLines={1}>
                  {p}
                </AppText>
              </View>
            ))}
            {programs.length > 3 && (
              <View style={[s.tag, s.tagMore]}>
                <AppText style={s.tagText}>+{programs.length - 3}</AppText>
              </View>
            )}
          </View>
        )}
      </View>
    </PressScale>
  );
}

export default function UniversitiesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Uni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("Все");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("universities").select("*").order("name");
    if (error) setError(error.message);
    else setItems(data as Uni[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cities = ["Все", ...Array.from(new Set(items.map((i) => i.city)))];
  const filtered = items.filter(
    (i) =>
      (city === "Все" || i.city === city) &&
      (type === "all" || i.type === type) &&
      i.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const filtersOn = city !== "Все" || type !== "all" || query.trim() !== "";
  const reset = () => {
    setCity("Все");
    setType("all");
    setQuery("");
  };

  return (
    <Screen>
      <AppText variant="h1">Вузы и колледжи</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x4 }}>
        Куда можно поступить в Казахстане
      </AppText>

      <View style={s.search}>
        <Ionicons name="search-outline" size={20} color={color.muted} />
        <TextInput
          style={s.searchInput}
          placeholder="Поиск по названию"
          placeholderTextColor={color.faint}
          cursorColor={color.forest}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query ? (
          <PressScale onPress={() => setQuery("")} scaleTo={0.9}>
            <Ionicons name="close-circle" size={20} color={color.faint} />
          </PressScale>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsIn}>
        <Chip label="Все" active={type === "all"} onPress={() => setType("all")} />
        <Chip label="Вузы" active={type === "university"} onPress={() => setType("university")} />
        <Chip label="Колледжи" active={type === "college"} onPress={() => setType("college")} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips} contentContainerStyle={s.chipsIn}>
        {cities.map((c) => (
          <Chip key={c} label={c} active={city === c} onPress={() => setCity(c)} />
        ))}
      </ScrollView>

      {!loading && !error && (
        <AppText variant="caption" style={{ marginTop: space.x4, marginBottom: space.x3 }}>
          Найдено: {filtered.length}
        </AppText>
      )}

      {loading && (
        <View style={{ gap: space.x4, marginTop: space.x4 }}>
          <SkeletonCard height={280} />
          <SkeletonCard height={280} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="search-outline"
          title="Ничего не найдено"
          text={filtersOn ? "Попробуйте изменить запрос или фильтры." : "Каталог пока пуст."}
          action={filtersOn ? "Сбросить фильтры" : undefined}
          onAction={reset}
        />
      )}

      {!loading &&
        !error &&
        filtered.map((u) => (
          <UniCard key={u.id} u={u} onPress={() => router.push({ pathname: "/university/[id]", params: { id: String(u.id) } })} />
        ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    minHeight: 52,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    paddingHorizontal: space.x4,
  },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 16, color: color.ink, paddingVertical: space.x3 },
  chips: { marginHorizontal: -space.gutter, marginTop: space.x3, flexGrow: 0 },
  chipsIn: { paddingHorizontal: space.gutter },
  card: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    overflow: "hidden",
    marginBottom: space.x4,
  },
  photo: { width: "100%", aspectRatio: 16 / 9 },
  placeholder: { backgroundColor: color.sand, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: space.x3,
    left: space.x3,
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: font.semibold, fontSize: 12, color: color.forest },
  body: { padding: space.x4, gap: 6 },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: { backgroundColor: color.limeSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, maxWidth: "100%" },
  tagMore: { backgroundColor: color.sand },
  tagText: { fontFamily: font.medium, fontSize: 12, color: color.forest },
});
