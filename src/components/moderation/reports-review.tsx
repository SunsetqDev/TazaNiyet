import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { reportCategory } from "../../lib/reports";
import { DIFFICULTY } from "../../lib/spot-tasks";
import { supabase } from "../../lib/supabase";
import { color, radius, space } from "../../lib/theme";
import { AppText } from "../ui/app-text";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Chip } from "../ui/chip";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { SectionHeader } from "../ui/section-header";
import { SkeletonCard } from "../ui/skeleton";
import { TextField } from "../ui/text-field";

type Row = {
  id: number;
  category: string;
  description: string;
  photo_paths: string[];
  lat: number;
  lng: number;
  accuracy_m: number | null;
  address: string | null;
  region: string | null;
  place_name: string | null;
  created_at: string;
  author_name: string;
  author_rejected: number;
  nearby_tasks: number;
};

const REJECT_REASONS = [
  "На фото не видно загрязнения",
  "Место указано неверно",
  "Это место уже есть на карте",
  "На фото люди, номера машин или документы",
];

const FRAUD_PENALTY = 20;

function ReportCard({ r, urls, onDone }: { r: Row; urls: Record<string, string>; onDone: () => void }) {
  const cat = reportCategory(r.category);
  const [title, setTitle] = useState(cat.label);
  const [difficulty, setDifficulty] = useState("easy");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const review = async (approve: boolean, why?: string, penalty = 0) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("review_report", {
      p_report_id: r.id,
      p_approve: approve,
      p_reason: why ?? null,
      p_title: approve ? title.trim() : null,
      p_difficulty: difficulty,
      p_points: approve ? DIFFICULTY[difficulty].points : null,
      p_penalty: penalty,
    });
    setBusy(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    Alert.alert("Результат", String(data));
    onDone();
  };

  const fraud = () =>
    Alert.alert("Пометить как обман?", `Заявка будет отклонена, у автора снимется ${FRAUD_PENALTY} TZ.`, [
      { text: "Отмена", style: "cancel" },
      { text: "Обман", style: "destructive", onPress: () => review(false, "Фейковая заявка", FRAUD_PENALTY) },
    ]);

  return (
    <Card style={s.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.x2 }}>
        {r.photo_paths.map((p) =>
          urls[p] ? (
            <Image key={p} source={{ uri: urls[p] }} style={s.photo} />
          ) : (
            <View key={p} style={[s.photo, s.noPhoto]}>
              <Ionicons name="image-outline" size={24} color={color.faint} />
            </View>
          )
        )}
      </ScrollView>

      <View style={s.meta}>
        <Ionicons name={cat.icon} size={18} color={color.forest} />
        <AppText variant="bodyStrong" style={{ flex: 1 }}>
          {cat.label}
        </AppText>
        <AppText variant="caption">{new Date(r.created_at).toLocaleString("ru-RU")}</AppText>
      </View>
      <AppText variant="caption">
        Автор: {r.author_name}
        {r.author_rejected > 0 ? ` · отклонено раньше: ${r.author_rejected}` : ""}
      </AppText>
      <AppText variant="body" color={color.ink} style={{ marginTop: space.x2 }}>
        {r.description}
      </AppText>

      <View style={s.map}>
        <MapView
          style={StyleSheet.absoluteFill}
          liteMode
          initialRegion={{ latitude: r.lat, longitude: r.lng, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        >
          <Marker coordinate={{ latitude: r.lat, longitude: r.lng }} pinColor={color.forest} />
        </MapView>
      </View>
      <AppText variant="caption">
        {[r.address, r.place_name ?? r.region].filter(Boolean).join(" · ")}
        {r.accuracy_m ? ` · точность ±${Math.round(r.accuracy_m)} м` : " · отмечено вручную"}
      </AppText>
      {r.nearby_tasks > 0 && (
        <View style={s.warn}>
          <Ionicons name="alert-circle-outline" size={18} color={color.warn} />
          <AppText variant="body" color={color.warn} style={{ flex: 1 }}>
            В радиусе 50 м уже есть активное задание — возможно, это повтор.
          </AppText>
        </View>
      )}

      {!rejecting ? (
        <>
          <SectionHeader title="Опубликовать как задание" />
          <TextField label="Название" value={title} onChangeText={setTitle} maxLength={80} />
          <AppText variant="bodyStrong" style={{ marginBottom: space.x2 }}>
            Сложность
          </AppText>
          <View style={s.row}>
            {Object.entries(DIFFICULTY).map(([k, d]) => (
              <Chip key={k} label={`${d.label} · ${d.points} TZ`} active={difficulty === k} onPress={() => setDifficulty(k)} />
            ))}
          </View>
          <Button label="Опубликовать на карте" icon="map-outline" onPress={() => review(true)} loading={busy} style={{ marginTop: space.x4 }} />
          <View style={[s.row, { marginTop: space.x2, gap: space.x2 }]}>
            <Button label="Отклонить" variant="secondary" onPress={() => setRejecting(true)} disabled={busy} style={{ flex: 1 }} />
            <Button label="Обман" icon="warning-outline" variant="danger" onPress={fraud} disabled={busy} style={{ flex: 1 }} />
          </View>
        </>
      ) : (
        <View style={s.rejectBox}>
          <AppText variant="overline" style={{ marginBottom: space.x2 }}>
            Причина — её увидит автор
          </AppText>
          {REJECT_REASONS.map((x) => (
            <Pressable key={x} style={({ pressed }) => [s.reason, pressed && { opacity: 0.6 }]} disabled={busy} onPress={() => review(false, x)}>
              <AppText variant="body" style={{ flex: 1 }}>
                {x}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={color.faint} />
            </Pressable>
          ))}
          <TextField
            placeholder="Или напишите свою причину"
            value={reason}
            onChangeText={setReason}
            multiline
            style={{ marginTop: space.x2, minHeight: 72, textAlignVertical: "top" }}
          />
          <Button label="Отклонить с этой причиной" variant="secondary" disabled={busy || !reason.trim()} onPress={() => review(false, reason)} />
          <Button label="Отмена" variant="ghost" onPress={() => setRejecting(false)} />
        </View>
      )}
    </Card>
  );
}

/** Вкладка модерации «Заявки»: проверка заявок о загрязнении и публикация их заданиями на карте. */
export function ReportsReview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase.rpc("get_reports_for_review");
    if (error) {
      setError(true);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Row[];
    setRows(list);
    const paths = list.flatMap((r) => r.photo_paths);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from("reports").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      for (const x of signed ?? []) if (x.path && x.signedUrl) map[x.path] = x.signedUrl;
      setUrls(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <SectionHeader title="Заявки о загрязнении" hint={loading ? undefined : String(rows.length)} action="Обновить" onAction={load} />
      {loading && <SkeletonCard height={420} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState icon="checkmark-done-outline" title="Новых заявок нет" text="Когда жители сообщат о загрязнении, заявки появятся здесь." />
      )}
      {!loading && !error && rows.map((r) => <ReportCard key={r.id} r={r} urls={urls} onDone={load} />)}
    </>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.x4 },
  photo: { width: 150, height: 200, borderRadius: radius.field, backgroundColor: color.sand },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: space.x2, marginTop: space.x4 },
  map: { height: 150, borderRadius: radius.field, overflow: "hidden", marginTop: space.x3, marginBottom: space.x1, backgroundColor: color.sand },
  warn: { flexDirection: "row", gap: space.x2, backgroundColor: color.warnSoft, borderRadius: radius.field, padding: space.x3, marginTop: space.x2 },
  row: { flexDirection: "row", flexWrap: "wrap", rowGap: space.x2 },
  rejectBox: { backgroundColor: color.cream, borderRadius: radius.field, padding: space.x3, marginTop: space.x4 },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    minHeight: 48,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    paddingHorizontal: space.x3,
    marginBottom: space.x2,
  },
});
