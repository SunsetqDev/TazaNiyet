import { Image, StyleSheet, Text, View } from "react-native";
import { color as palette, font } from "../lib/theme";

export const AVATAR_EMOJIS = ["🐻", "🦊", "🐼", "🐨", "🦉", "🐸", "🐢", "🦋", "🐝", "🐬", "🦔", "🦦", "🐧", "🦜", "🌻", "🌲"];

export const AVATAR_COLORS = ["#97A97C", "#F2C94C", "#9CC5E8", "#F4A6A6", "#C9B3E8", "#F2B880", "#8ED1C0", "#D9D3C0"];

type Props = {
  name?: string | null;
  emoji?: string | null;
  color?: string | null;
  /** ссылка на фото-аватар (своё фото видит только владелец) — важнее эмодзи и буквы */
  photo?: string | null;
  size?: number;
};

export function Avatar({ name, emoji, color, photo, size = 52 }: Props) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (photo) {
    return <Image source={{ uri: photo }} style={[round, { backgroundColor: palette.sand }]} />;
  }
  return (
    <View style={[s.box, round, { backgroundColor: color || palette.lime }]}>
      {emoji ? (
        <Text style={{ fontSize: size * 0.52 }}>{emoji}</Text>
      ) : (
        <Text style={{ fontSize: size * 0.42, fontFamily: font.semibold, color: palette.ink }}>
          {(name || "?").charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
