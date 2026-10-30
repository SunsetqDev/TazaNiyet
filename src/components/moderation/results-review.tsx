import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { DIFFICULTY } from "../../lib/spot-tasks";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";
import { AppText } from "../ui/app-text";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { SectionHeader } from "../ui/section-header";
import { SkeletonCard } from "../ui/skeleton";
import { TextField } from "../ui/text-field";
import { Shot } from "./shot";

type Row = {
  id: number;
  title: string;
  points: number;
  difficulty: string;
  photo_paths: string[];
  result_photo_path: string | null;
  result_distance_m: number | null;
  result_submitted_at: string | null;
  reject_count: number;
  assignee_name: string;
  address: string | null;
};

const REJECT_REASONS = [
  "На фото «после» мусор всё ещё виден",
  "Это фото другого места",
  "Фото размытое или тёмное",
  "На фото люди, номера машин или документы",
];

function ResultCard({ r, urls, onDone }: { r: Row; urls: Record<string, string>; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const review = async (approve: boolean, why?: string, penalty = 0) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("review_task_result", {
      p_id: r.id,
      p_approve: approve,
      p_reason: why ?? null,
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
    Alert.alert("Пометить как обман?", `Результат отклонится, у исполнителя снимется ${r.points} TZ, задание снова станет доступным.`, [
      { text: "Отмена", style: "cancel" },
      { text: "Обман", style: "destructive", onPress: () => review(false, "Фейковый результат", r.points) },
    ]);

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{r.title}</AppText>
          <AppText variant="caption">
            {r.assignee_name} · {DIFFICULTY[r.difficulty]?.label ?? ""} · {r.address ?? "без адреса"}
          </AppText>
        </View>
        <AppText style={s.pts}>+{r.points} TZ</AppText>
      </View>

      <View style={s.photos}>
        <Shot label="Было" uri={urls[r.photo_paths[0]]} />
        <Shot label="Стало" uri={r.result_photo_path ? urls[r.result_photo_path] : null} />
      </View>

      <View style={s.facts}>
        <Ionicons name="navigate-outline" size={16} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Снято в {Math.round(r.result_distance_m ?? 0)} м от точки
          {r.result_submitted_at ? ` · ${new Date(r.result_submitted_at).toLocaleString("ru-RU")}` : ""}
          {r.reject_count > 0 ? ` · отклоняли раньше: ${r.reject_count}` : ""}
        </AppText>
      </View>

      {!rejecting ? (
        <>
          <Button label={`Принять · +${r.points} TZ`} icon="checkmark" onPress={() => review(true)} loading={busy} style={{ marginTop: space.x4 }} />
          <View style={[s.row, { marginTop: space.x2 }]}>
            <Button label="Отклонить" variant="secondary" onPress={() => setRejecting(true)} disabled={busy} style={{ flex: 1 }} />
            <Button label="Обман" icon="warning-outline" variant="danger" onPress={fraud} disabled={busy} style={{ flex: 1 }} />
          </View>
        </>
      ) : (
        <View style={s.rejectBox}>
          <AppText variant="overline" style={{ marginBottom: space.x2 }}>
            Причина — исполнитель сможет переснять
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

/** Вкладка модерации «Уборка»: фото результата рядом с фото места до уборки. */
export function ResultsReview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase.rpc("get_task_results_for_review");
    if (error) {
      setError(true);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Row[];
    setRows(list);
    const paths = list.flatMap((r) => [r.photo_paths[0], r.result_photo_path]).filter((x): x is string => !!x);
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
      <SectionHeader title="Результаты уборки" hint={loading ? undefined : String(rows.length)} action="Обновить" onAction={load} />
      {loading && <SkeletonCard height={380} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState icon="checkmark-done-outline" title="Нечего проверять" text="Когда участники отправят фото после уборки, они появятся здесь." />
      )}
      {!loading && !error && rows.map((r) => <ResultCard key={r.id} r={r} urls={urls} onDone={load} />)}
    </>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.x4 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: space.x3 },
  pts: { fontFamily: font.bold, fontSize: 14, color: color.forest },
  photos: { flexDirection: "row", gap: space.x3, marginTop: space.x4 },
  facts: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.x3 },
  row: { flexDirection: "row", gap: space.x2 },
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
