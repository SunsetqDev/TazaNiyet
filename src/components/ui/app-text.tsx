import { Text, type TextProps } from "react-native";
import { color as palette, type as typeScale, type TypeVariant } from "../../lib/theme";

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
};

/** Текст на шрифтах дизайн-системы. Цвет по умолчанию — ink, для подписей — muted. */
export function AppText({ variant = "body", color, style, ...rest }: Props) {
  const fallback = variant === "caption" || variant === "overline" ? palette.muted : palette.ink;
  return <Text {...rest} style={[typeScale[variant], { color: color ?? fallback }, style]} />;
}
