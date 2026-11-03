import { Icon, type IconName } from "../../components/icon";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../components/avatar";
import { AppText } from "../../components/ui/app-text";
import { Button } from "../../components/ui/button";
import { ListRow, RowIcon } from "../../components/ui/list-row";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { avatarUrl } from "../../lib/avatar";
import { supabase } from "../../lib/supabase";
import { color as palette, font, radius, space } from "../../lib/theme";
import { tr } from "../../lib/i18n";

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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.stat}>
      <AppText style={s.statNum}>{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function MenuIcon({ name, danger }: { name: IconName; danger?: boolean }) {
  return (
    <RowIcon tint={danger ? palette.dangerSoft : palette.limeSoft}>
      <Icon name={name} size={20} color={danger ? palette.danger : palette.forest} />
    </RowIcon>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
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
          .select("name, nickname, avatar_emoji, avatar_color, avatar_path, points, is_moderator")
          .eq("id", user.id)
          .single();
        setName(p?.name ?? "");
        setNickname(p?.nickname ?? null);
        setEmoji(p?.avatar_emoji ?? null);
        setColor(p?.avatar_color ?? null);
        avatarUrl(p?.avatar_path).then(setPhoto);
        setPoints(p?.points ?? 0);
        setIsMod(p?.is_moderator === true);

        const { data: subs } = await supabase
          .from("submissions")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("status", "approved");
        const list = (subs ?? []).map((x: any) => x.created_at as string);
        setApproved(list.length);
        setStreak(calcStreak(list));
        setReady(true);
      };
      load();
    }, [])
  );

  const signOut = () => {
    Alert.alert(tr("Выйти из аккаунта?"), "", [
      { text: tr("Отмена"), style: "cancel" },
      {
        text: tr("Выйти"),
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  // cur / max — для подписи прогресса у закрытых значков
  const badges = [
    { icon: "🌱", title: tr("Первый шаг"), cur: approved, max: 1 },
    { icon: "🌿", title: tr("5 заданий"), cur: approved, max: 5 },
    { icon: "🌳", title: tr("10 заданий"), cur: approved, max: 10 },
    { icon: "🔥", title: tr("3 дня подряд"), cur: streak, max: 3 },
    { icon: "🏆", title: tr("Неделя подряд"), cur: streak, max: 7 },
    { icon: "⭐", title: "100 TZ", cur: points, max: 100 },
    { icon: "💎", title: "500 TZ", cur: points, max: 500 },
  ];
  const gotCount = badges.filter((b) => b.cur >= b.max).length;

  return (
    <Screen>
      <View style={s.head}>
        <Avatar name={nickname || name} emoji={emoji} color={color} photo={photo} size={88} />
        {ready ? (
          <>
            <AppText variant="h1" style={{ marginTop: space.x3, textAlign: "center" }}>
              {nickname || name || tr("Мой профиль")}
            </AppText>
            {nickname && name ? <AppText variant="caption">{name}{" "}{tr("· видно только вам")}</AppText> : null}
          </>
        ) : (
          <Skeleton width={180} height={28} style={{ marginTop: space.x3 }} />
        )}
        <Button
          label={tr("Изменить профиль")}
          icon="create-outline"
          variant="secondary"
          onPress={() => router.push("/edit-profile")}
          style={s.editBtn}
        />
      </View>

      <View style={s.stats}>
        <Stat value={points} label={tr("очков TZ")} />
        <Stat value={approved} label={tr("принято")} />
        <Stat value={streak} label={tr("дней подряд")} />
      </View>

      <SectionHeader title={tr("Значки")} hint={tr("{0} из {1}", gotCount, badges.length)} />
      <View style={s.badges}>
        {badges.map((b) => {
          const got = b.cur >= b.max;
          return (
            <View key={b.title} style={[s.badge, got && s.badgeOn]}>
              {got ? (
                <Text style={s.badgeIcon}>{b.icon}</Text>
              ) : (
                <View style={s.lock}>
                  <Icon name="lock-closed-outline" size={18} color={palette.faint} />
                </View>
              )}
              <AppText style={s.badgeTitle} color={got ? palette.ink : palette.muted} numberOfLines={2}>
                {b.title}
              </AppText>
              {!got && (
                <AppText variant="caption" color={palette.faint}>
                  {Math.min(b.cur, b.max)} / {b.max}
                </AppText>
              )}
            </View>
          );
        })}
      </View>

      <SectionHeader title={tr("Активность")} />
      <View style={s.group}>
        <ListRow first title={tr("Мои задания и статусы")} leading={<MenuIcon name="list-outline" />} onPress={() => router.push("/my")} />
      </View>

      <SectionHeader title={tr("Поступление")} />
      <View style={s.group}>
        <ListRow
          first
          title={tr("Моё портфолио")}
          subtitle={tr("QR-код с подтверждёнными заданиями")}
          leading={<MenuIcon name="qr-code-outline" />}
          onPress={() => router.push("/portfolio")}
        />
        <ListRow title={tr("Вузы и колледжи")} subtitle={tr("каталог и требования к поступлению")} leading={<MenuIcon name="school-outline" />} onPress={() => router.push("/universities")} />
      </View>

      <SectionHeader title={tr("Аккаунт")} />
      <View style={s.group}>
        <ListRow
          first
          title={tr("Настройки и конфиденциальность")}
          leading={<MenuIcon name="settings-outline" />}
          onPress={() => router.push("/settings")}
        />
        {isMod && (
          <ListRow title={tr("Проверка заданий")} subtitle={tr("для модераторов")} leading={<MenuIcon name="shield-checkmark-outline" />} onPress={() => router.push("/moderator")} />
        )}
        <ListRow title={tr("Выйти")} danger leading={<MenuIcon name="log-out-outline" danger />} onPress={signOut} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { alignItems: "center", marginTop: space.x2 },
  editBtn: { minHeight: 44, marginTop: space.x4, paddingHorizontal: space.x5 },
  stats: { flexDirection: "row", gap: space.x2, marginTop: space.x6 },
  stat: { flex: 1, backgroundColor: palette.sand, borderRadius: 18, padding: space.x3 },
  statNum: { fontFamily: font.display, fontSize: 26, lineHeight: 32, color: palette.ink },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: space.x2 },
  badge: {
    width: "31.5%",
    minHeight: 112,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 20,
    padding: space.x3,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  badgeOn: { backgroundColor: palette.limeSoft, borderColor: palette.limeSoft },
  badgeIcon: { fontSize: 30 },
  lock: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.cream, alignItems: "center", justifyContent: "center" },
  badgeTitle: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, textAlign: "center" },
  group: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.card,
    paddingHorizontal: space.x4,
  },
});
