import { StyleSheet, Text, View } from "react-native";
import { color as palette, font } from "../lib/theme";

export const AVATAR_EMOJIS = ["🐻", "🦊", "🐼", "🐨", "🦉", "🐸", "🐢", "🦋", "🐝", "🐬", "🦔", "🦦", "🐧", "🦜", "🌻", "🌲"];

export const AVATAR_COLORS = ["#97A97C", "#F2C94C", "#9CC5E8", "#F4A6A6", "#C9B3E8", "#F2B880", "#8ED1C0", "#D9D3C0"];

type Props = {
  name?: string | null;
  emoji?: string | null;
  color?: string | null;
  size?: number;
};

export function Avatar({ name, emoji, color, size = 52 }: Props) {
  return (
    <View style={[s.box, { width: size, height: size, borderRadius: size / 2, backgroundColor: color || palette.lime }]}>
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
