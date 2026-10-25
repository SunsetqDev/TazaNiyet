import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

export default function SettingsScreen() {
  const router = useRouter();

  const deleteAccount = () => {
    Alert.alert(
      "Удалить аккаунт?",
      "Будут удалены профиль, очки, заявки и фотографии. Это нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const { data: s } = await supabase.auth.getSession();
            const uid = s.session?.user.id;
            if (uid) {
              const { data: files } = await supabase.storage.from("submissions").list(uid, { limit: 1000 });
              if (files && files.length > 0) {
                await supabase.storage.from("submissions").remove(files.map((f) => `${uid}/${f.name}`));
              }
            }
            const { error } = await supabase.rpc("delete_my_account");
            if (error) {
              Alert.alert("Ошибка", error.message);
              return;
            }
            await supabase.auth.signOut();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Настройки</Text>

      <Pressable style={styles.item} onPress={() => router.push("/privacy")}>
        <Text style={styles.itemText}>🔒 Политика конфиденциальности</Text>
      </Pressable>

      <Pressable style={[styles.item, styles.danger]} onPress={deleteAccount}>
        <Text style={styles.dangerText}>🗑 Удалить аккаунт и все данные</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23", marginBottom: 20 },
  item: { backgroundColor: "white", borderRadius: 16, padding: 18, marginBottom: 12 },
  itemText: { color: "#1C2B23", fontWeight: "600", fontSize: 16 },
  danger: { backgroundColor: "#FCE8E6" },
  dangerText: { color: "#B3261E", fontWeight: "700", fontSize: 16 },
});