import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { supabase } from "../../lib/supabase";

const GREEN = "#1F7A4D";

type TaskRow = { title: string; emoji: string; points: number; date: string };
type Result = { name: string; place: string | null; points: number; tasks: TaskRow[] };

export default function PortfolioScreen() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [mine, setMine] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      router.replace("/login");
      return;
    }
    const { data: link } = await supabase.from("portfolio_links").select("code").maybeSingle();
    setCode(link?.code ?? null);
    if (link?.code) {
      const { data } = await supabase.rpc("get_portfolio", { p_code: link.code });
      setMine(data as Result);
    } else {
      setMine(null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const create = async () => {
    setBusy(true);
    const { error } = await supabase.from("portfolio_links").insert({});
    setBusy(false);
    if (error) Alert.alert("Ошибка", error.message);
    else load();
  };

  const revoke = () => {
    Alert.alert("Отозвать код?", "Старый код и QR перестанут работать. Вы сможете создать новый.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Отозвать",
        style: "destructive",
        onPress: async () => {
          const { data: s } = await supabase.auth.getSession();
          await supabase.from("portfolio_links").delete().eq("user_id", s.session!.user.id);
          load();
        },
      },
    ]);
  };

  const verify = async () => {
    setChecked(null);
    setNotFound(false);
    if (!input.trim()) return;
    const { data, error } = await supabase.rpc("get_portfolio", { p_code: input.trim().toLowerCase() });
    if (error || !data) setNotFound(true);
    else setChecked(data as Result);
  };

  const renderResult = (r: Result) => (
    <View style={styles.result}>
      <Text style={styles.rName}>{r.name}</Text>
      {r.place ? <Text style={styles.rPlace}>📍 {r.place}</Text> : null}
      <Text style={styles.rPoints}>{r.points} TZ</Text>
      <Text style={styles.rSub}>Подтверждённых заданий: {r.tasks.length}</Text>
      {r.tasks.map((t, i) => (
        <View key={i} style={styles.taskRow}>
          <Text style={styles.taskText}>{t.emoji} {t.title}</Text>
          <Text style={styles.taskDate}>{new Date(t.date).toLocaleDateString("ru-RU")} · +{t.points}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Моё портфолио</Text>
      <Text style={styles.sub}>
        Покажите код при поступлении или на конкурсе. Видны только имя, место, очки и названия принятых заданий. Фото не показываются.
      </Text>

      {loading && <ActivityIndicator color={GREEN} />}

      {!loading && !code && (
        <Pressable style={styles.btn} onPress={create} disabled={busy}>
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Создать код портфолио</Text>}
        </Pressable>
      )}

      {code && (
        <View style={styles.qrCard}>
          <QRCode value={`tazaniyet:${code}`} size={180} />
          <Text style={styles.code}>{code}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => Share.share({ message: `Моё портфолио TazaNiyet. Код проверки: ${code}` })}
          >
            <Text style={styles.btnText}>Поделиться кодом</Text>
          </Pressable>
          <Pressable onPress={revoke}>
            <Text style={styles.revoke}>Отозвать код</Text>
          </Pressable>
        </View>
      )}

      {mine && (
        <>
          <Text style={styles.section}>Так увидят ваше портфолио</Text>
          {renderResult(mine)}
        </>
      )}

      <Text style={styles.section}>Проверить чужой код</Text>
      <TextInput
        style={styles.input}
        placeholder="Введите код портфолио"
        autoCapitalize="none"
        value={input}
        onChangeText={setInput}
      />
      <Pressable style={styles.btnOutline} onPress={verify}>
        <Text style={styles.btnOutlineText}>Проверить</Text>
      </Pressable>
      {notFound && <Text style={styles.error}>Код не найден или отозван.</Text>}
      {checked && (
        <>
          <Text style={styles.ok}>✓ Портфолио подтверждено</Text>
          {renderResult(checked)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23" },
  sub: { color: "#5B6B62", marginTop: 6, marginBottom: 20, lineHeight: 20 },
  section: { fontSize: 20, fontWeight: "700", color: "#1C2B23", marginTop: 24, marginBottom: 12 },
  btn: { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12 },
  btnText: { color: "white", fontWeight: "700", fontSize: 16 },
  btnOutline: { borderWidth: 2, borderColor: GREEN, borderRadius: 14, padding: 14, alignItems: "center" },
  btnOutlineText: { color: GREEN, fontWeight: "700", fontSize: 16 },
  qrCard: { backgroundColor: "white", borderRadius: 20, padding: 24, alignItems: "center" },
  code: { fontSize: 22, fontWeight: "800", color: "#1C2B23", marginTop: 14, letterSpacing: 2 },
  revoke: { color: "#B3261E", fontWeight: "600", marginTop: 16 },
  input: { backgroundColor: "white", borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#DDE5DF", marginBottom: 12 },
  error: { color: "#B3261E", marginTop: 12 },
  ok: { color: GREEN, fontWeight: "800", fontSize: 16, marginTop: 16, marginBottom: 8 },
  result: { backgroundColor: "white", borderRadius: 16, padding: 16 },
  rName: { fontSize: 22, fontWeight: "800", color: "#1C2B23" },
  rPlace: { color: "#5B6B62", marginTop: 4 },
  rPoints: { fontSize: 32, fontWeight: "800", color: GREEN, marginTop: 8 },
  rSub: { color: "#7C8A82", marginBottom: 10 },
  taskRow: { borderTopWidth: 1, borderTopColor: "#EEF2EF", paddingVertical: 10 },
  taskText: { fontSize: 15, color: "#1C2B23", fontWeight: "600" },
  taskDate: { fontSize: 12, color: "#7C8A82", marginTop: 2 },
});