import { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { haptic } from "../lib/haptics";
import { C, R, S } from "../lib/theme";
import { PressScale } from "./anim";
import { Confetti } from "./confetti";
import { Mascot } from "./mascot";

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Confetti />
        <Animated.View entering={ZoomIn.springify().damping(11)} style={s.card}>
          <Mascot mood="cheer" size={150} />
          <Text style={s.title}>{rank ? "Новый ранг!" : "Задание принято!"}</Text>
          <Text style={s.big}>+{gained} TZ</Text>
          {rank && (
            <Text style={s.rank}>
              {rank.icon} {rank.name}
            </Text>
          )}
          <PressScale style={s.btn} onPress={onClose}>
            <Text style={s.btnText}>Ура!</Text>
          </PressScale>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(42,50,36,0.55)", alignItems: "center", justifyContent: "center", padding: S.md },
  card: { width: "100%", maxWidth: 340, backgroundColor: C.card, borderRadius: 32, padding: S.lg, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: C.text, marginTop: S.xs },
  big: { fontSize: 44, fontWeight: "900", color: C.sageDark, marginTop: 4 },
  rank: { fontSize: 18, fontWeight: "700", color: C.text, marginTop: S.xs },
  btn: { backgroundColor: C.sageDark, borderRadius: R.btn, paddingVertical: 16, paddingHorizontal: 48, marginTop: S.md },
  btnText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
});