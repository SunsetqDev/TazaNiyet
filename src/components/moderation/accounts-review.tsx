import { Icon } from "../icon";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";
import { AppText } from "../ui/app-text";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState, ErrorState } from "../ui/empty-state";
import { SectionHeader } from "../ui/section-header";
import { SkeletonCard } from "../ui/skeleton";

type Row = {
  user_id: string;
  display_name: string;
  place: string | null;
  points: number;
  penalties: number;
  last_penalty_at: string | null;
  last_active_at: string;
  kind: "fraud" | "inactive";
};

const REASON = { fraud: "Многочисленный обман", inactive: "Неактивен больше 6 месяцев" };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("ru-RU") : "—");

function AccountCard({ r, onDone }: { r: Row; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const fraud = r.kind === "fraud";

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("moderator-delete-account", {
      body: { user_id: r.user_id, reason: REASON[r.kind] },
    });
    setBusy(false);
    if (error) {
      let msg = "Проверьте интернет и попробуйте снова.";
      try {
        const body = await (error as any)?.context?.json();
        if (body?.error) msg = body.error;
      } catch {}
      Alert.alert("Не удалось удалить", msg);
      return;
    }
    Alert.alert("Аккаунт удалён", `${r.display_name}: профиль, заявки и фото удалены.`);
    onDone();
  };

  const confirm = () =>
    Alert.alert(
      "Удалить аккаунт?",
      `${r.display_name} — ${REASON[r.kind].toLowerCase()}. Профиль, заявки, фото и очки удалятся навсегда, отменить нельзя.`,
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: remove },
      ]
    );

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <View style={[s.badge, { backgroundColor: fraud ? color.dangerSoft : color.warnSoft }]}>
          <Icon name={fraud ? "warning-outline" : "moon-outline"} size={20} color={fraud ? color.danger : color.warn} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" numberOfLines={1}>
            {r.display_name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {[r.place, `${r.points} TZ`].filter(Boolean).join(" · ")}
          </AppText>
        </View>
      </View>
      <View style={s.facts}>
        <AppText variant="caption">
          Нарушений за 90 дней: <AppText style={[s.num, fraud && { color: color.danger }]}>{r.penalties}</AppText>
          {r.last_penalty_at ? ` · последнее ${fmt(r.last_penalty_at)}` : ""}
        </AppText>
        <AppText variant="caption">
          Последняя активность: <AppText style={[s.num, !fraud && { color: color.warn }]}>{fmt(r.last_active_at)}</AppText>
        </AppText>
      </View>
      <Button label="Удалить аккаунт" variant="danger" icon="trash-outline" onPress={confirm} loading={busy} style={{ marginTop: space.x3 }} />
    </Card>
  );
}

/** Вкладка модерации «Аккаунты»: нарушители (3+ «Обмана» за 90 дней) и неактивные (6 месяцев). Удаляет модератор вручную. */
export function AccountsReview() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error } = await supabase.rpc("get_accounts_for_review");
    setRows((data ?? []) as Row[]);
    setError(!!error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fraud = rows.filter((r) => r.kind === "fraud");
  const inactive = rows.filter((r) => r.kind === "inactive");

  return (
    <>
      <View style={s.rules}>
        <Icon name="information-circle-outline" size={18} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Сюда попадают аккаунты с 3 и более «Обманами» за 90 дней или без активности больше 6 месяцев. Модераторов здесь нет.
        </AppText>
      </View>
      {loading && <SkeletonCard height={200} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && (
        <>
          <SectionHeader title="Нарушители" hint={String(fraud.length)} action="Обновить" onAction={load} />
          {fraud.length === 0 ? (
            <EmptyState icon="shield-checkmark-outline" title="Нарушителей нет" text="Аккаунты с тремя «Обманами» за 90 дней появятся здесь." />
          ) : (
            fraud.map((r) => <AccountCard key={r.user_id} r={r} onDone={load} />)
          )}
          <SectionHeader title="Неактивные" hint={String(inactive.length)} />
          {inactive.length === 0 ? (
            <EmptyState icon="moon-outline" title="Неактивных нет" text="Аккаунты без активности больше 6 месяцев появятся здесь." />
          ) : (
            inactive.map((r) => <AccountCard key={r.user_id} r={r} onDone={load} />)
          )}
        </>
      )}
    </>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.x3 },
  head: { flexDirection: "row", alignItems: "center", gap: space.x3 },
  badge: { width: 44, height: 44, borderRadius: radius.field, alignItems: "center", justifyContent: "center" },
  facts: { marginTop: space.x3, gap: 4 },
  num: { fontFamily: font.semibold, fontSize: 13, color: color.ink },
  rules: {
    flexDirection: "row",
    gap: space.x2,
    backgroundColor: color.sand,
    borderRadius: radius.field,
    padding: space.x3,
    marginTop: space.x4,
  },
});
