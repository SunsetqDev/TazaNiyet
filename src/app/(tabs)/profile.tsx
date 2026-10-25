import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { C, R, S } from "../../lib/theme";

function calcStreak(dates: string[]) {
  const days = new Set(dates.map((d) => new Date(d).toDateString()));
  let streak = 0;
  const cur = new Date();
  if (!days.has(cur.toDateString())) cur.setDate(cur.getDate() - 1);
  while (days.has(cur.toDateString())) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [approved, setApproved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMod, setIsMod] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const { data: sess } = await supabase.auth.getSession();
        const user = sess.session?.user;
        if (!user) {
          router.replace("/login");
          return;
        }
        const { data: p } = await supabase
          .from("profiles")
          .select("name, points, is_moderator")
          .eq("id", user.id)
          .single();
        setName(p?.name ?? "");
        setPoints(p?.points ?? 0);
        setIsMod(p?.is_moderator === true);
        const { data: subs } = await supabase.from("submissions").select("created_at").eq("status", "approved");
        const list = (subs ?? []).map((x: any) => x.created_at as string);
        setApproved(list.length);
        setStreak(calcStreak(list));
      };
      load();
    }, [])
  );

  const signOut = () => {
    Alert.alert("Выйти из аккаунта?", "", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const badges = [
    { icon: "🌱", title: "Первый шаг", got: approved >= 1 },
    { icon: "🌿", title: "5 заданий", got: approved >= 5 },
    { icon: "🌳", title: "10 заданий", got: approved >= 10 },
    { icon: "🔥", title: "3 дня подряд", got: streak >= 3 },
    { icon: "🏆", title: "Неделя подряд", got: streak >= 7 },
    { icon: "⭐", title: "100 TZ", got: points >= 100 },
    { icon: "💎", title: "500 TZ", got: points >= 500 },
  ];

  const Menu = ({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) => (
    <Pressable style={s.menuItem} onPress={onPress}>
      <Text style={s.menuIcon}>{icon}</Text>
      <Text style={[s.menuText, danger && { color: C.danger }]}>{label}</Text>
      <Text style={s.chev}>›</Text>
    </Pressable>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{(name || "?").charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={s.name}>{name || "Мой профиль"}</Text>

      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statNum}>{points}</Text>
          <Text style={s.statLabel}>очков TZ</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statNum}>{approved}</Text>
          <Text style={s.statLabel}>выполнено</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statNum}>{streak}</Text>
          <Text style={s.statLabel}>дней подряд</Text>
        </View>
      </View>

      <Text style={s.section}>Значки</Text>
      <View style={s.badges}>
        {badges.map((b) => (
          <View key={b.title} style={[s.badge, !b.got && { opacity: 0.4 }]}>
            <Text style={s.badgeIcon}>{b.got ? b.icon : "🔒"}</Text>
            <Text style={s.badgeTitle}>{b.title}</Text>
          </View>
        ))}
      </View>

      <Text style={s.section}>Меню</Text>
      <Menu icon="📋" label="Мои задания и статусы" onPress={() => router.push("/my")} />
      <Menu icon="⚙️" label="Настройки и конфиденциальность" onPress={() => router.push("/settings")} />
      {isMod && <Menu icon="🛡" label="Проверка заданий" onPress={() => router.push("/moderator")} />}
      <Menu icon="🚪" label="Выйти" onPress={signOut} danger />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 70, paddingBottom: S.xl + 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.sage, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  avatarText: { fontSize: 36, fontWeight: "700", color: C.text },
  name: { fontSize: 26, fontWeight: "700", color: C.text, textAlign: "center", marginTop: S.sm, marginBottom: S.lg },
  stats: { flexDirection: "row", gap: S.sm, marginBottom: S.xl },
  stat: { flex: 1, backgroundColor: C.sageSoft, borderRadius: R.card, padding: S.md - 4, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "800", color: C.sageDark },
  statLabel: { fontSize: 12, color: C.muted, marginTop: 4 },
  section: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: S.md },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginBottom: S.xl },
  badge: { width: "30.5%", backgroundColor: C.card, borderRadius: R.card, paddingVertical: S.md - 4, alignItems: "center" },
  badgeIcon: { fontSize: 28 },
  badgeTitle: { fontSize: 11, fontWeight: "600", color: C.text, marginTop: 6, textAlign: "center" },
  menuItem: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: R.card, padding: S.md, marginBottom: S.sm },
  menuIcon: { fontSize: 20, marginRight: S.sm + 2 },
  menuText: { flex: 1, fontSize: 16, fontWeight: "600", color: C.text },
  chev: { fontSize: 22, color: C.muted },
});