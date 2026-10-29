import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { color, radius, space } from "../../lib/theme";
import { AppText } from "./app-text";
import { Button } from "./button";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  tone?: "neutral" | "error";
};

/** Пустой список или ошибка: иконка, заголовок, пояснение и действие. */
export function EmptyState({ icon, title, text, action, onAction, tone = "neutral" }: Props) {
  const err = tone === "error";
  return (
    <View style={s.box}>
      <View style={[s.icon, { backgroundColor: err ? color.dangerSoft : color.limeSoft }]}>
        <Ionicons name={icon} size={26} color={err ? color.danger : color.forest} />
      </View>
      <AppText variant="h3" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {text ? (
        <AppText variant="body" color={color.muted} style={{ textAlign: "center" }}>
          {text}
        </AppText>
      ) : null}
      {action && onAction ? (
        <Button label={action} variant="secondary" onPress={onAction} style={{ marginTop: space.x2 }} />
      ) : null}
    </View>
  );
}

/** Ошибка загрузки с кнопкой «Повторить». Сырой текст ошибки пользователю не показываем. */
export function ErrorState({ onRetry, text }: { onRetry?: () => void; text?: string }) {
  return (
    <EmptyState
      tone="error"
      icon="cloud-offline-outline"
      title="Не удалось загрузить"
      text={text ?? "Проверьте интернет и попробуйте ещё раз."}
      action={onRetry ? "Повторить" : undefined}
      onAction={onRetry}
    />
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", gap: space.x2, paddingVertical: space.x8, paddingHorizontal: space.x4, borderRadius: radius.card },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: space.x2 },
});
