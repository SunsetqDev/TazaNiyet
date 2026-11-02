import { Icon } from "../icon";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { haptic } from "../../lib/haptics";
import { color, space } from "../../lib/theme";
import { IconBlob } from "../icon";
import { AppText } from "./app-text";

type Props = {
  title: string;
  subtitle?: string | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** первая строка списка — без верхней границы */
  first?: boolean;
  danger?: boolean;
};

/** Строка списка с разделителем. Шеврон показывается, если строка нажимается. */
export function ListRow({ title, subtitle, leading, trailing, onPress, first = false, danger = false }: Props) {
  const body = (
    <>
      {leading}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={danger ? color.danger : undefined} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevron-forward" size={18} color={color.faint} /> : null}
    </>
  );
  const style = [s.row, !first && s.line];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}
    >
      {body}
    </Pressable>
  );
}

/** Иконка или рисунок слева в строке — на капле-листке 40×40 (бледный лайм заменяется песочным: иконки сами лаймовые). */
export function RowIcon({ children, tint = color.sand }: { children: ReactNode; tint?: string }) {
  return <IconBlob tint={tint === color.limeSoft ? color.sand : tint}>{children}</IconBlob>;
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, minHeight: 56, paddingVertical: space.x3 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
});
