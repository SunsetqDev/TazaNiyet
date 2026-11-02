import { Icon, IconBlob, type IconName } from "../icon";
import { StyleSheet, View } from "react-native";
import { color, radius, space } from "../../lib/theme";
import { AppText } from "./app-text";
import { Button } from "./button";

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
      <View style={{ marginBottom: space.x2 }}>
        <IconBlob tint={err ? color.dangerSoft : color.lime} size={60}>
          <Icon name={icon} size={28} color={err ? color.danger : color.forest} />
        </IconBlob>
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
});
