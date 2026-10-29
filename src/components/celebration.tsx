import { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { haptic } from "../lib/haptics";
import { color, font, radius, space, type } from "../lib/theme";
import { Confetti } from "./confetti";
import { Mascot } from "./mascot";
import { AppText } from "./ui/app-text";
import { Button } from "./ui/button";

type Props = {
  visible: boolean;
  gained: number;
  rank: { name: string; icon: string } | null;
  onClose: () => void;
};

/** Праздничный экран: Барс прыгает, летит конфетти, очки «выстреливают». */
export function Celebration({ visible, gained, rank, onClose }: Props) {
  useEffect(() => {
    if (visible) haptic.success();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Confetti />
        <Animated.View entering={ZoomIn.springify().damping(11)} style={s.card}>
          <View style={s.stage}>
            <Mascot mood="cheer" size={140} />
          </View>
          <AppText variant="overline" color={color.forest} style={{ marginTop: space.x4 }}>
            {rank ? "Новый ранг" : "Задание принято"}
          </AppText>
          <AppText style={s.big}>+{gained} TZ</AppText>
          {rank && (
            <View style={s.rank}>
              <Text style={{ fontSize: 18 }}>{rank.icon}</Text>
              <AppText variant="bodyStrong" color={color.forest}>
                {rank.name}
              </AppText>
            </View>
          )}
          <Button label="Ура!" onPress={onClose} style={{ alignSelf: "stretch", marginTop: space.x5 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(37,42,39,0.6)", alignItems: "center", justifyContent: "center", padding: space.x5 },
  card: { width: "100%", maxWidth: 340, backgroundColor: color.cream, borderRadius: 32, padding: space.x5, alignItems: "center" },
  stage: { width: "100%", alignItems: "center", backgroundColor: color.forest, borderRadius: radius.card, paddingTop: space.x4 },
  big: { ...type.display, fontSize: 48, lineHeight: 56, color: color.ink, marginTop: space.x1 },
  rank: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.lime,
    borderRadius: radius.pill,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
    marginTop: space.x2,
  },
});
