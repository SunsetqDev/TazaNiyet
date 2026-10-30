import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { ListRow, RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { SkeletonCard } from "../components/ui/skeleton";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

type TaskRow = { title: string; emoji: string; points: number; date: string };
type Result = { name: string; place: string | null; points: number; tasks: TaskRow[] };

// задания группами по месяцам, в порядке, в котором их вернул сервер
function byMonth(tasks: TaskRow[]) {
  const groups: { month: string; items: TaskRow[] }[] = [];
  for (const t of tasks) {
    const month = new Date(t.date).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const g = groups.find((x) => x.month === month);
    if (g) g.items.push(t);
    else groups.push({ month, items: [t] });
  }
  return groups;
}

function ResultView({ r }: { r: Result }) {
  return (
    <Card>
      <AppText variant="h2">{r.name}</AppText>
      {r.place ? (
        <View style={s.placeRow}>
          <Ionicons name="location-outline" size={14} color={color.muted} />
          <AppText variant="caption">{r.place}</AppText>
        </View>
      ) : null}
      <View style={s.resStats}>
        <View style={s.resStat}>
          <AppText style={s.resNum}>{r.points}</AppText>
          <AppText variant="caption">очков TZ</AppText>
        </View>
        <View style={s.resStat}>
          <AppText style={s.resNum}>{r.tasks.length}</AppText>
          <AppText variant="caption">подтверждённых заданий</AppText>
        </View>
      </View>
      {r.tasks.length === 0 ? (
        <AppText variant="body" color={color.muted} style={{ marginTop: space.x3 }}>
          Подтверждённых заданий пока нет.
        </AppText>
      ) : (
        byMonth(r.tasks).map((g) => (
          <View key={g.month} style={{ marginTop: space.x4 }}>
            <AppText variant="overline">{g.month}</AppText>
            {g.items.map((t, i) => (
              <ListRow
                key={`${t.date}-${i}`}
                first={i === 0}
                title={t.title}
                subtitle={new Date(t.date).toLocaleDateString("ru-RU")}
                leading={
                  <RowIcon>
                    <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                  </RowIcon>
                }
                trailing={<AppText style={s.rowPts}>+{t.points}</AppText>}
              />
            ))}
          </View>
        ))
      )}
    </Card>
  );
}

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

  return (
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1">Портфолио</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x5 }}>
        Покажите код при поступлении или на конкурсе. Видны только имя, место, очки и названия принятых заданий. Фото не
        показываются.
      </AppText>

      {loading && <SkeletonCard height={320} />}

      {!loading && !code && (
        <Card>
          <EmptyState
            icon="qr-code-outline"
            title="Создайте код портфолио"
            text="По коду или QR любой проверяющий увидит ваши подтверждённые задания."
          />
          <Button label="Создать код" icon="add" onPress={create} loading={busy} />
        </Card>
      )}

      {!loading && code && (
        <Card style={s.qrCard}>
          <View style={s.qrBox}>
            <QRCode value={`tazaniyet:${code}`} size={184} color={color.ink} backgroundColor={color.surface} />
          </View>
          <AppText variant="overline" style={{ marginTop: space.x4 }}>
            Код проверки
          </AppText>
          <AppText style={s.code} selectable>
            {code}
          </AppText>
          <Button
            label="Поделиться кодом"
            icon="share-outline"
            onPress={() => Share.share({ message: `Моё портфолио TazaNiyet. Код проверки: ${code}` })}
            style={{ alignSelf: "stretch", marginTop: space.x4 }}
          />
          <Button label="Отозвать код" variant="danger" onPress={revoke} style={{ marginTop: space.x1 }} />
        </Card>
      )}

      {mine && (
        <>
          <SectionHeader title="Так увидят ваше портфолио" />
          <ResultView r={mine} />
        </>
      )}

      <SectionHeader title="Проверить чужой код" />
      <Card>
        <TextField
          placeholder="Введите код портфолио"
          autoCapitalize="none"
          autoCorrect={false}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            setNotFound(false);
          }}
          onSubmitEditing={verify}
          returnKeyType="search"
          error={notFound ? "Код не найден или отозван." : null}
        />
        <Button label="Проверить" variant="secondary" icon="search-outline" onPress={verify} />
      </Card>

      {checked && (
        <>
          <View style={s.ok}>
            <Ionicons name="checkmark-circle" size={20} color={color.forest} />
            <AppText variant="bodyStrong" color={color.forest}>
              Портфолио подтверждено
            </AppText>
          </View>
          <ResultView r={checked} />
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  qrCard: { alignItems: "center", padding: space.x5 },
  qrBox: { padding: space.x3, backgroundColor: color.surface, borderRadius: radius.field },
  code: { fontFamily: font.bold, fontSize: 22, letterSpacing: 2, color: color.ink, marginTop: 4 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  resStats: { flexDirection: "row", gap: space.x2, marginTop: space.x4 },
  resStat: { flex: 1, backgroundColor: color.sand, borderRadius: 16, padding: space.x3 },
  resNum: { fontFamily: font.display, fontSize: 24, lineHeight: 30, color: color.ink },
  rowPts: { fontFamily: font.bold, fontSize: 14, color: color.forest },
  ok: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.limeSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
    alignSelf: "flex-start",
    marginTop: space.x5,
    marginBottom: space.x3,
  },
});
