import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { ReportsReview } from "../components/moderation/reports-review";
import { ResultsReview } from "../components/moderation/results-review";
import { Shot } from "../components/moderation/shot";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Chip } from "../components/ui/chip";
import { EmptyState } from "../components/ui/empty-state";
import { RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { SkeletonCard } from "../components/ui/skeleton";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

const REASONS = [
  "Фото «после» не показывает результат",
  "Фото размытое или тёмное",
  "Фото не по заданию",
  "Нет фото «до» или «после»",
];

type Item = {
  id: number;
  created_at: string;
  tasks: { emoji: string; title: string; points: number } | null;
  beforeUrl?: string;
  afterUrl?: string;
};

// вкладки модерации: обычные задания, заявки о загрязнении, результаты уборки мест с карты
const TABS = [
  { k: "tasks", label: "Задания" },
  { k: "reports", label: "Заявки" },
  { k: "results", label: "Уборка" },
] as const;

export default function ModeratorScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("tasks");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [consentBusy, setConsentBusy] = useState(false);
  const [rejectFor, setRejectFor] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("id, before_path, after_path, created_at, tasks(emoji, title, points)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      Alert.alert("Ошибка", error.message);
      setLoading(false);
      return;
    }
    const result: Item[] = [];
    for (const r of data as any[]) {
      const { data: signed } = await supabase.storage
        .from("submissions")
        .createSignedUrls([r.before_path, r.after_path], 600);
      result.push({
        id: r.id,
        created_at: r.created_at,
        tasks: r.tasks,
        beforeUrl: signed?.[0]?.signedUrl ?? undefined,
        afterUrl: signed?.[1]?.signedUrl ?? undefined,
      });
    }
    setItems(result);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const review = async (id: number, approve: boolean, reason?: string) => {
    setBusy(id);
    const { data, error } = await supabase.rpc("review_submission", {
      sub_id: id,
      approve,
      reason: reason ?? null,
    });
    setBusy(null);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    setRejectFor(null);
    setCustomReason("");
    Alert.alert("Результат", String(data));
    load();
  };

  const fraud = (it: Item) => {
    const penalty = it.tasks?.points ?? 0;
    Alert.alert(
      "Пометить как обман?",
      `Заявка будет отклонена, у пользователя снимется ${penalty} TZ.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Обман",
          style: "destructive",
          onPress: async () => {
            setBusy(it.id);
            const { data, error } = await supabase.rpc("penalize_submission", {
              sub_id: it.id,
              penalty,
            });
            setBusy(null);
            if (error) {
              Alert.alert("Ошибка", error.message);
              return;
            }
            Alert.alert("Результат", String(data));
            load();
          },
        },
      ]
    );
  };

  const confirmConsent = async () => {
    if (!email.trim()) {
      Alert.alert("Введите почту ребёнка");
      return;
    }
    setConsentBusy(true);
    const { data, error } = await supabase.rpc("confirm_parent_consent", { p_email: email.trim() });
    setConsentBusy(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    Alert.alert("Результат", String(data));
    if (data === "Согласие подтверждено") setEmail("");
  };

  return (
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1">Проверка заданий</AppText>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <Chip key={t.k} label={t.label} active={tab === t.k} onPress={() => setTab(t.k)} />
        ))}
      </View>

      {tab === "reports" && <ReportsReview />}
      {tab === "results" && <ResultsReview />}

      {tab === "tasks" && (
      <>
      <Card style={{ marginTop: space.x5 }}>
        <AppText variant="h3">Согласие родителей</AppText>
        <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x4 }}>
          Подтверждайте только после того, как связались с родителем или получили бумажное согласие.
        </AppText>
        <TextField
          placeholder="Почта ребёнка (из регистрации)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button label="Подтвердить согласие" variant="secondary" onPress={confirmConsent} loading={consentBusy} />
      </Card>

      <SectionHeader title="Ожидают проверки" hint={loading ? undefined : String(items.length)} />

      {loading && (
        <View style={{ gap: space.x4 }}>
          <SkeletonCard height={320} />
        </View>
      )}
      {!loading && items.length === 0 && <EmptyState icon="checkmark-done-outline" title="Все заявки проверены" text="Новые появятся здесь." />}

      {!loading &&
        items.map((it) => {
          const isBusy = busy === it.id;
          return (
            <Card key={it.id} style={s.card}>
              <View style={s.head}>
                <RowIcon>
                  <Text style={{ fontSize: 20 }}>{it.tasks?.emoji}</Text>
                </RowIcon>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{it.tasks?.title}</AppText>
                  <AppText variant="caption">
                    Заявка №{it.id} · {new Date(it.created_at).toLocaleString("ru-RU")}
                  </AppText>
                </View>
                <AppText style={s.pts}>+{it.tasks?.points} TZ</AppText>
              </View>

              <View style={s.photos}>
                <Shot label="До" uri={it.beforeUrl} />
                <Shot label="После" uri={it.afterUrl} />
              </View>

              <View style={s.row}>
                <Button
                  label={rejectFor === it.id ? "Отмена" : "Отклонить"}
                  variant="secondary"
                  disabled={isBusy}
                  onPress={() => {
                    setCustomReason("");
                    setRejectFor(rejectFor === it.id ? null : it.id);
                  }}
                  style={{ flex: 1 }}
                />
                <Button label="Принять" icon="checkmark" loading={isBusy} onPress={() => review(it.id, true)} style={{ flex: 1 }} />
              </View>

              {rejectFor === it.id && (
                <View style={s.rejectBox}>
                  <AppText variant="overline" style={{ marginBottom: space.x2 }}>
                    Причина отказа — её увидит пользователь
                  </AppText>
                  {REASONS.map((r) => (
                    <Pressable
                      key={r}
                      style={({ pressed }) => [s.reason, pressed && { opacity: 0.6 }]}
                      disabled={isBusy}
                      onPress={() => review(it.id, false, r)}
                    >
                      <AppText variant="body" style={{ flex: 1 }}>
                        {r}
                      </AppText>
                      <Ionicons name="chevron-forward" size={16} color={color.faint} />
                    </Pressable>
                  ))}
                  <TextField
                    placeholder="Или напишите свою причину"
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    style={{ marginTop: space.x2, minHeight: 80, textAlignVertical: "top" }}
                  />
                  <Button
                    label="Отклонить с этой причиной"
                    variant="secondary"
                    disabled={isBusy || !customReason.trim()}
                    onPress={() => review(it.id, false, customReason)}
                  />
                </View>
              )}

              <Button
                label="Обман — отклонить и снять очки"
                icon="warning-outline"
                variant="danger"
                disabled={isBusy}
                onPress={() => fraud(it)}
                style={{ marginTop: space.x2 }}
              />
            </Card>
          );
        })}
      </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  tabs: { flexDirection: "row", marginTop: space.x4 },
  card: { marginBottom: space.x4 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: space.x3 },
  pts: { fontFamily: font.bold, fontSize: 14, color: color.forest },
  photos: { flexDirection: "row", gap: space.x3, marginTop: space.x4 },
  row: { flexDirection: "row", gap: space.x2, marginTop: space.x4 },
  rejectBox: { backgroundColor: color.cream, borderRadius: radius.field, padding: space.x3, marginTop: space.x3 },
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
