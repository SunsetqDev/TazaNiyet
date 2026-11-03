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
import { tr, trs, locale } from "../../lib/i18n";

type Row = {
  message_id: number;
  sender_id: string | null;
  sender_name: string;
  body: string;
  deleted: boolean;
  sent_at: string;
  chat_title: string;
  reasons: string[];
  reports: number;
  context: { id: number; name: string; body: string }[] | null;
};

const plural = (n: number) =>
  n % 10 === 1 && n % 100 !== 11 ? tr("{0} жалоба", n) : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? tr("{0} жалобы", n) : tr("{0} жалоб", n);

function ReportCard({ r, onDone }: { r: Row; onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  const resolve = async (del: boolean, penalty: boolean) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("resolve_message_report", { p_message: r.message_id, p_delete: del, p_penalty: penalty });
    setBusy(false);
    if (error) {
      Alert.alert(tr("Ошибка"), trs(error.message));
      return;
    }
    Alert.alert(tr("Готово"), trs(String(data)));
    onDone();
  };

  const violation = () =>
    Alert.alert(
      tr("Удалить и записать нарушение?"),
      tr("Сообщение удалится, {0} получит нарушение. При 3 нарушениях за 90 дней аккаунт попадёт во вкладку «Аккаунты».", r.sender_name),
      [
        { text: tr("Отмена"), style: "cancel" },
        { text: tr("Нарушение"), style: "destructive", onPress: () => resolve(true, true) },
      ]
    );

  return (
    <Card style={s.card}>
      <View style={s.head}>
        <View style={s.icon}>
          <Icon name="flag-outline" size={18} color={color.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {r.sender_name}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {r.chat_title} · {new Date(r.sent_at).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </AppText>
        </View>
        <AppText style={s.count}>{plural(r.reports)}</AppText>
      </View>

      {r.reasons.length > 0 && (
        <AppText variant="caption" style={{ marginTop: space.x2 }}>{tr("Причина:")}{" "}{Array.from(new Set(r.reasons)).join(", ")}
        </AppText>
      )}

      {/* три сообщения до жалобы, последнее — само сообщение */}
      <View style={s.context}>
        {(r.context ?? []).map((c) => {
          const target = c.id === r.message_id;
          return (
            <View key={c.id} style={[s.line, target && s.target]}>
              <AppText style={s.name}>{c.name}</AppText>
              <AppText style={[s.body, target && { fontFamily: font.semibold }]}>{c.body}</AppText>
            </View>
          );
        })}
      </View>

      <View style={s.row}>
        <Button label={tr("Без нарушений")} variant="secondary" onPress={() => resolve(false, false)} disabled={busy} style={{ flex: 1 }} />
        <Button label={tr("Удалить")} variant="secondary" onPress={() => resolve(true, false)} disabled={busy || r.deleted} style={{ flex: 1 }} />
      </View>
      <Button label={tr("Удалить и записать нарушение")} variant="danger" icon="warning-outline" onPress={violation} disabled={busy} />
    </Card>
  );
}

/** Вкладка модерации «Жалобы»: сообщения из мессенджера, на которые пожаловались. */
export function MessageReports() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_message_reports");
    setRows((data ?? []) as Row[]);
    setError(!!error);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <SectionHeader title={tr("Жалобы на сообщения")} hint={loading ? undefined : String(rows.length)} action={tr("Обновить")} onAction={load} />
      {loading && <SkeletonCard height={260} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState icon="chatbubbles-outline" title={tr("Жалоб нет")} text={tr("Когда участники пожалуются на сообщение, оно появится здесь.")} />
      )}
      {!loading && !error && rows.map((r) => <ReportCard key={r.message_id} r={r} onDone={load} />)}
    </>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.x3 },
  head: { flexDirection: "row", alignItems: "center", gap: space.x3 },
  icon: { width: 36, height: 36, borderRadius: 12, backgroundColor: color.dangerSoft, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: font.semibold, fontSize: 12, color: color.danger },
  context: { backgroundColor: color.cream, borderRadius: radius.field, padding: space.x3, marginTop: space.x3, gap: space.x2 },
  line: { paddingLeft: space.x2, borderLeftWidth: 2, borderLeftColor: color.line },
  target: { borderLeftColor: color.danger },
  name: { fontFamily: font.semibold, fontSize: 12, color: color.muted },
  body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: color.ink },
  row: { flexDirection: "row", gap: space.x2, marginTop: space.x3, marginBottom: space.x2 },
});
