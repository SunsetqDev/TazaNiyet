import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, space } from "../../lib/theme";

type Props = {
  children?: ReactNode;
  /** false — экран без прокрутки (например, центрированная форма) */
  scroll?: boolean;
  /** true — для экранов Stack без таб-бара: отступ снизу под системную панель */
  bottomInset?: boolean;
  /** закреплённый низ (кнопка «Отправить»), поднимается вместе с клавиатурой */
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Основа экрана: безопасные области, кремовый фон, прокрутка и клавиатура. */
export function Screen({ children, scroll = true, bottomInset = false, footer, refreshControl, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: insets.top + space.x4,
    paddingHorizontal: space.gutter,
    paddingBottom: (bottomInset && !footer ? insets.bottom : 0) + space.x10,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.cream }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View
          style={{
            paddingHorizontal: space.gutter,
            paddingTop: space.x3,
            paddingBottom: (bottomInset ? insets.bottom : 0) + space.x3,
            backgroundColor: color.cream,
            borderTopWidth: 1,
            borderTopColor: color.line,
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
