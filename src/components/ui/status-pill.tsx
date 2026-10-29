import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { color, font, radius, space } from "../../lib/theme";
import { AppText } from "./app-text";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS: Record<string, { label: string; icon: IconName; fg: string; bg: string }> = {
  pending: { label: "На проверке", icon: "time-outline", fg: color.warn, bg: color.warnSoft },
  approved: { label: "Принято", icon: "checkmark-circle-outline", fg: color.forest, bg: color.limeSoft },
  rejected: { label: "Отклонено", icon: "close-circle-outline", fg: color.danger, bg: color.dangerSoft },
};

/** Статус заявки (submissions.status): pending / approved / rejected. */
export function StatusPill({ status }: { status: string }) {
  const st = STATUS[status] ?? STATUS.pending;
  return (
    <View style={[s.pill, { backgroundColor: st.bg }]}>
      <Ionicons name={st.icon} size={14} color={st.fg} />
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
