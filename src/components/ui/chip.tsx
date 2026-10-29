import { StyleSheet } from "react-native";
import { color, font, radius, space } from "../../lib/theme";
import { PressScale } from "../anim";
import { AppText } from "./app-text";

type Props = { label: string; active?: boolean; onPress?: () => void };

/** Чип фильтра. Активный — тёмный (ink), неактивный — светлый с границей. */
export function Chip({ label, active = false, onPress }: Props) {
  return (
    <PressScale onPress={onPress} scaleTo={0.95} style={[s.chip, active && s.on]}>
      <AppText style={{ fontFamily: font.medium, fontSize: 13 }} color={active ? color.cream : color.muted}>
        {label}
      </AppText>
    </PressScale>
  );
}

const s = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: space.x4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    marginRight: space.x2,
  },
  on: { backgroundColor: color.ink, borderColor: color.ink },
});
