import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const GREEN = "#1F7A4D";

export default function TaskScreen() {
  const { title, points, emoji, description } = useLocalSearchParams<{
    title: string;
    points: string;
    emoji: string;
    description: string;
  }>();
  const router = useRouter();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const takePhoto = async (setter: (uri: string) => void) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Нужен доступ к камере", "Разрешите камеру в настройках телефона.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const submit = () => {
    if (!before || !after) {
      Alert.alert("Нужны оба фото", "Сделайте фото «до» и «после».");
      return;
    }
    setSent(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>

      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.points}>+{points} TZ</Text>

      <Text style={styles.section}>Как выполнить</Text>
      <Text style={styles.text}>{description}</Text>

      <View style={styles.row}>
        <Pressable style={styles.photoBox} onPress={() => takePhoto(setBefore)}>
          {before ? (
            <Image source={{ uri: before }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>📷{"\n"}Фото ДО</Text>
          )}
        </Pressable>
        <Pressable style={styles.photoBox} onPress={() => takePhoto(setAfter)}>
          {after ? (
            <Image source={{ uri: after }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>📷{"\n"}Фото ПОСЛЕ</Text>
          )}
        </Pressable>
      </View>

      {sent ? (
        <View style={styles.success}>
          <Text style={styles.successText}>✓ Отправлено на проверку</Text>
          <Text style={styles.successSmall}>Очки TZ появятся после проверки.</Text>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Отправить на проверку</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 20 },
  emoji: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: "800", color: "#1C2B23", marginTop: 8 },
  points: { fontSize: 20, fontWeight: "800", color: GREEN, marginTop: 4, marginBottom: 20 },
  section: { fontSize: 18, fontWeight: "700", color: "#1C2B23", marginBottom: 8 },
  text: { fontSize: 15, color: "#3F4F46", lineHeight: 24, marginBottom: 20 },
  row: { flexDirection: "row", gap: 12, marginBottom: 24 },
  photoBox: {
    flex: 1,
    height: 160,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#DDE5DF",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoText: { textAlign: "center", color: "#5B6B62", fontWeight: "600" },
  button: { backgroundColor: GREEN, borderRadius: 16, padding: 18, alignItems: "center" },
  buttonText: { color: "white", fontSize: 17, fontWeight: "700" },
  success: { backgroundColor: "#EAF6EF", borderRadius: 16, padding: 18, alignItems: "center" },
  successText: { color: GREEN, fontSize: 17, fontWeight: "800" },
  successSmall: { color: "#5B6B62", marginTop: 4 },
});