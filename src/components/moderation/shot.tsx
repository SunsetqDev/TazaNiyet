import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { color, radius, space } from "../../lib/theme";
import { AppText } from "../ui/app-text";

/** Фото 3:4 с подписью сверху («До», «После»); если фото нет — заглушка. */
export function Shot({ label, uri }: { label: string; uri?: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="overline" style={{ marginBottom: space.x1 }}>
        {label}
      </AppText>
      {uri ? (
        <Image source={{ uri }} style={s.photo} />
      ) : (
        <View style={[s.photo, s.noPhoto]}>
          <Ionicons name="image-outline" size={24} color={color.faint} />
          <AppText variant="caption">Нет фото</AppText>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  photo: { width: "100%", aspectRatio: 3 / 4, borderRadius: radius.field, backgroundColor: color.sand },
  noPhoto: { alignItems: "center", justifyContent: "center", gap: 4 },
});
