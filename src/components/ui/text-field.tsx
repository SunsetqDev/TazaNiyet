import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { color, font, radius, space } from "../../lib/theme";
import { AppText } from "./app-text";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
};

/** Поле ввода: подпись сверху, подсказка или ошибка снизу, зелёная рамка в фокусе. */
export function TextField({ label, hint, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.wrap}>
      {label ? (
        <AppText variant="bodyStrong" style={s.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={color.faint}
        cursorColor={color.forest}
        selectionColor={color.limeSoft}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[s.input, focused && s.focused, error ? s.error : null, style]}
      />
      {error ? (
        <AppText variant="caption" color={color.danger} style={s.below}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" style={s.below}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: space.x4 },
  label: { marginBottom: space.x2 },
  input: {
    minHeight: 52,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    fontFamily: font.regular,
    fontSize: 16,
    color: color.ink,
  },
  focused: { borderColor: color.forest },
  error: { borderColor: color.danger },
  below: { marginTop: 6 },
});
