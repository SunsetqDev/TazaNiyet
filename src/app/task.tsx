import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

type Photo = { uri: string; base64: string };

export default function TaskScreen() {
  const { id, title, points, emoji, description } = useLocalSearchParams<{
    id: string;
    title: string;
    points: string;
    emoji: string;
    description: string;
  }>();
  const router = useRouter();
  const [before, setBefore] = useState<Photo | null>(null);
  const [after, setAfter] = useState<Photo | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const takePhoto = async (setter: (p: Photo) => void) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Нужен доступ к камере", "Разрешите камеру в настройках телефона.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64 || asset.base64.length < 1000) {
      Alert.alert("Фото не получилось", "Сделайте фото ещё раз.");
      return;
    }
    setter({ uri: asset.uri, base64: asset.base64 });
  };

  const uploadPhoto = async (photo: Photo, userId: string, label: string) => {
    const path = `${userId}/${Date.now()}-${label}.jpg`;
    const bytes = decode(photo.base64);
    if (bytes.byteLength < 1000) {
      throw new Error("Фото пустое. Сделайте его заново.");
    }
    const { error } = await supabase.storage
      .from("submissions")
      .upload(path, bytes, { contentType: "image/jpeg" });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!before || !after) {
      Alert.alert("Нужны оба фото", "Сделайте фото «до» и «после».");
      return;
    }
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const beforePath = await uploadPhoto(before, user.id, "before");
      const afterPath = await uploadPhoto(after, user.id, "after");
      const { error } = await supabase.from("submissions").insert({
        task_id: Number(id),
        before_path: beforePath,
        after_path: afterPath,
      });
      if (error) {
        if (error.code === "23505") {
          Alert.alert("Уже отправлено", "Это задание уже на проверке. Дождитесь результата.");
          return;
        }
        throw error;
      }
      setSent(true);
    } catch (e: any) {
      Alert.alert("Не удалось отправить", e?.message ?? "Проверьте интернет и попробуйте снова.");
    } finally {
      setSending(false);
    }
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
        <Pressable style={styles.photoBox} onPress={() => takePhoto(setBefore)} disabled={sent}>
          {before ? (
            <Image source={{ uri: before.uri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>📷{"\n"}Фото ДО</Text>
          )}
        </Pressable>
        <Pressable style={styles.photoBox} onPress={() => takePhoto(setAfter)} disabled={sent}>
          {after ? (
            <Image source={{ uri: after.uri }} style={styles.photo} />
          ) : (
            <Text style={styles.photoText}>📷{"\n"}Фото ПОСЛЕ</Text>
          )}
        </Pressable>
      </View>

      {sent ? (
        <View style={styles.success}>
          <Text style={styles.successText}>✓ Отправлено на проверку</Text>
          <Text style={styles.successSmall}>Очки TZ появятся после проверки.</Text>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.link}>К заданиям</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={submit} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Отправить на проверку</Text>
          )}
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
  link: { color: GREEN, fontWeight: "700", marginTop: 14 },
});