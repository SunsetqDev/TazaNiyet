import { Icon, type IconName } from "../icon";
import { StyleSheet, View } from "react-native";
import { color, font, radius, space } from "../../lib/theme";
import { AppText } from "./app-text";
import { tr } from "../../lib/i18n";

const STATUS: Record<string, { label: string; icon: IconName; fg: string; bg: string }> = {
  pending: { label: tr("На проверке"), icon: "time-outline", fg: color.warn, bg: color.warnSoft },
  approved: { label: tr("Принято"), icon: "checkmark-circle-outline", fg: color.forest, bg: color.limeSoft },
  rejected: { label: tr("Отклонено"), icon: "close-circle-outline", fg: color.danger, bg: color.dangerSoft },
  // заявки о загрязнении (reports.status)
  submitted: { label: tr("Отправлено"), icon: "paper-plane-outline", fg: color.muted, bg: color.sand },
  under_review: { label: tr("На проверке"), icon: "time-outline", fg: color.warn, bg: color.warnSoft },
  // задания на карте (spot_tasks.status)
  available: { label: tr("Доступно"), icon: "leaf-outline", fg: color.forest, bg: color.limeSoft },
  in_progress: { label: tr("Выполняется"), icon: "walk-outline", fg: color.ink, bg: color.sand },
  completed: { label: tr("Выполнено"), icon: "checkmark-done-outline", fg: color.forest, bg: color.limeSoft },
};

/** Статус заявки: submissions.status (pending / approved / rejected) или reports.status (+ submitted / under_review). */
export function StatusPill({ status }: { status: string }) {
  const st = STATUS[status] ?? STATUS.pending;
  return (
    <View style={[s.pill, { backgroundColor: st.bg }]}>
      <Icon name={st.icon} size={14} color={st.fg} />
      <AppText style={{ fontFamily: font.semibold, fontSize: 12 }} color={st.fg}>
        {st.label}
      </AppText>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: space.x3 - 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
