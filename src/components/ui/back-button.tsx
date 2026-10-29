import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { color, space } from "../../lib/theme";
import { PressScale } from "../anim";

/** Круглая кнопка «назад» для экранов Stack. Без истории — уходит на главную. */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const back = () => {
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  return (
    <PressScale onPress={back} scaleTo={0.92} style={s.btn}>
      <Ionicons name="arrow-back" size={22} color={color.ink} />
    </PressScale>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.x4,
  },
});
