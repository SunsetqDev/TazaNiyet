import { Pressable, StyleSheet, View } from "react-native";
import { color, font, space } from "../../lib/theme";
import { AppText } from "./app-text";

type Props = { title: string; hint?: string; action?: string; onAction?: () => void };

/** Заголовок секции: слева название, справа подсказка или действие. */
export function SectionHeader({ title, hint, action, onAction }: Props) {
  return (
    <View style={s.row}>
      <AppText variant="h2" style={{ flex: 1 }}>
        {title}
      </AppText>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={12}>
          <AppText style={{ fontFamily: font.semibold, fontSize: 13 }} color={color.forest}>
            {action}
          </AppText>
        </Pressable>
      ) : hint ? (
        <AppText variant="caption">{hint}</AppText>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: space.x3, marginTop: space.x6, marginBottom: space.x3 },
});
