import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { color, font, radius, space } from "../../lib/theme";
import { PressScale } from "../anim";
import { AppText } from "./app-text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const FG: Record<Variant, string> = {
  primary: color.lime,
  secondary: color.ink,
  ghost: color.forest,
  danger: color.danger,
};

/** Кнопка дизайн-системы. На экране — не больше одной primary. */
export function Button({ label, onPress, variant = "primary", icon, loading = false, disabled = false, style }: Props) {
  const fg = FG[variant];
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.97}
      style={[s.base, s[variant], (disabled || loading) && s.dim, style]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.row}>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <AppText style={{ fontFamily: font.semibold, fontSize: 16 }} color={fg}>
            {label}
          </AppText>
        </View>
      )}
    </PressScale>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: space.x6, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: space.x2 },
  primary: { backgroundColor: color.forest },
  secondary: { borderWidth: 1, borderColor: color.ink },
  ghost: { minHeight: 44 },
  danger: { minHeight: 44 },
  dim: { opacity: 0.5 },
});
