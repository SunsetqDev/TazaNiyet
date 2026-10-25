import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator, Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

type Item = {
  id: number;
  created_at: string;
  tasks: { emoji: string; title: string; points: number } | null;
  beforeUrl?: string;
  afterUrl?: string;
};

export default function ModeratorScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [consentBusy, setConsentBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("id, before_path, after_path, created_at, tasks(emoji, title, points)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) {
      Alert.alert("Ошибка", error.message);
      setLoading(false);
      return;
    }
    const result: Item[] = [];
    for (const r of data as any[]) {
      const { data: signed } = await supabase.storage
        .from("submissions")
        .createSignedUrls([r.before_path, r.after_path], 600);
      result.push({
        id: r.id,
        created_at: r.created_at,
        tasks: r.tasks,
        beforeUrl: signed?.[0]?.signedUrl,
        afterUrl: signed?.[1]?.signedUrl,
      });
    }
    setItems(result);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const review = async (id: number, approve: boolean) => {
    setBusy(id);
    const { data, error } = await supabase.rpc("review_submission", { sub_id: id, approve });
    setBusy(null);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    Alert.alert("Результат", String(data));
    load();
  };

  const fraud = (it: Item) => {
    const penalty = it.tasks?.points ?? 0;
    Alert.alert(
      "Пометить как обман?",
      `Заявка будет отклонена, у пользователя снимется ${penalty} TZ.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Обман",
          style: "destructive",
          onPress: async () => {
            setBusy(it.id);
            const { data, error } = await supabase.rpc("penalize_submission", {
              sub_id: it.id,
              penalty,
            });
            setBusy(null);
            if (error) {
              Alert.alert("Ошибка", error.message);
              return;
            }
            Alert.alert("Результат", String(data));
            load();
          },
        },
      ]
    );
  };

  const confirmConsent = async () => {
    if (!email.trim()) {
      Alert.alert("Введите почту ребёнка");
      return;
    }
    setConsentBusy(true);
    const { data, error } = await supabase.rpc("confirm_parent_consent", { p_email: email.trim() });
    setConsentBusy(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    Alert.alert("Результат", String(data));
    if (data === "Согласие подтверждено") setEmail("");
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Проверка заданий</Text>

      <View style={styles.consent}>
        <Text style={styles.consentTitle}>Согласие родителей</Text>
        <Text style={styles.consentText}>
          Подтверждайте только после того, как связались с родителем или получили бумажное согласие.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Почта ребёнка (из регистрации)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable style={styles.consentBtn} onPress={confirmConsent} disabled={consentBusy}>
          {consentBusy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.yesText}>Подтвердить согласие</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sub}>Ожидают проверки: {items.length}</Text>

      {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 20 }} />}
      {!loading && items.length === 0 && <Text style={styles.empty}>Все заявки проверены 🎉</Text>}

      {items.map((it) => (
        <View key={it.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {it.tasks?.emoji} {it.tasks?.title} (+{it.tasks?.points} TZ)
          </Text>
          <Text style={styles.date}>
            Заявка №{it.id}, {new Date(it.created_at).toLocaleString("ru-RU")}
          </Text>
          <View style={styles.photos}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ДО</Text>
              {it.beforeUrl && <Image source={{ uri: it.beforeUrl }} style={styles.photo} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ПОСЛЕ</Text>
              {it.afterUrl && <Image source={{ uri: it.afterUrl }} style={styles.photo} />}
            </View>
          </View>
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.no]} disabled={busy === it.id} onPress={() => review(it.id, false)}>
              <Text style={styles.noText}>Отклонить</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.yes]} disabled={busy === it.id} onPress={() => review(it.id, true)}>
              <Text style={styles.yesText}>Принять</Text>
            </Pressable>
          </View>
          <Pressable style={styles.fraudBtn} disabled={busy === it.id} onPress={() => fraud(it)}>
            <Text style={styles.fraudText}>⚠️ Обман (отклонить и снять очки)</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 50 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23", marginBottom: 16 },
  consent: { backgroundColor: "#FFF6D6", borderRadius: 16, padding: 16, marginBottom: 20 },
  consentTitle: { fontSize: 16, fontWeight: "800", color: "#8A6D00" },
  consentText: { color: "#5B4A00", marginVertical: 8, lineHeight: 20 },
  input: { backgroundColor: "white", borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: "#E6DDB0", marginBottom: 10 },
  consentBtn: { backgroundColor: GREEN, borderRadius: 12, padding: 14, alignItems: "center" },
  sub: { color: "#5B6B62", marginBottom: 12 },
  empty: { color: "#7C8A82", marginTop: 12 },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1C2B23" },
  date: { fontSize: 12, color: "#7C8A82", marginTop: 2, marginBottom: 10 },
  photos: { flexDirection: "row", gap: 10, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", color: "#5B6B62", marginBottom: 4 },
  photo: { width: "100%", height: 150, borderRadius: 10, backgroundColor: "#EEE" },
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  yes: { backgroundColor: GREEN },
  yesText: { color: "white", fontWeight: "700" },
  no: { backgroundColor: "#EEF2EF" },
  noText: { color: "#3F4F46", fontWeight: "700" },
  fraudBtn: { backgroundColor: "#FCE8E6", borderRadius: 12, padding: 12, alignItems: "center", marginTop: 10 },
  fraudText: { color: "#B3261E", fontWeight: "700" },
});