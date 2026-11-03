import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Icon } from "../components/icon";
import { Chip } from "../components/ui/chip";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { ListRow, RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { clearAvatarCache } from "../lib/avatar";
import { lang, tr, trs, type Lang } from "../lib/i18n";
import { getThemeMode, saveLang, saveTheme } from "../lib/prefs";
import { supabase } from "../lib/supabase";
import { color, radius, space, type ThemeMode } from "../lib/theme";

const SITE = "https://sunsetqdev.github.io/TazaNiyet/";
const SUPPORT = "Rusuafflex@gmail.com";

// правила сообщества — короткая памятка (показывается в окне)
const RULES = [
  "Фото — только настоящие и сделанные на месте. Обман приводит к удалению аккаунта.",
  "Без лиц людей, номеров машин и документов на фото.",
  "Вежливость в сообщениях. Грубость, угрозы и спам — нарушение.",
  "Не сообщайте в чате адрес, телефон и школу, не соглашайтесь на встречи с незнакомыми.",
  "Опасный мусор (стекло, шприцы, химикаты) не трогайте — сообщите взрослым.",
];

export default function SettingsScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeMode>("system");
  const current = lang();

  useEffect(() => {
    getThemeMode().then(setTheme);
  }, []);

  // язык и тема применяются при запуске — после выбора приложение перезапускается
  const pickLang = (l: Lang) => {
    if (l === current) return;
    Alert.alert(tr("Сменить язык?"), tr("Приложение перезапустится."), [
      { text: tr("Отмена"), style: "cancel" },
      { text: tr("Перезапустить"), onPress: () => saveLang(l) },
    ]);
  };
  const pickTheme = (m: ThemeMode) => {
    if (m === theme) return;
    Alert.alert(tr("Сменить тему?"), tr("Приложение перезапустится."), [
      { text: tr("Отмена"), style: "cancel" },
      { text: tr("Перезапустить"), onPress: () => saveTheme(m) },
    ]);
  };

  const clearCache = async () => {
    clearAvatarCache();
    const keys = await AsyncStorage.getAllKeys().catch(() => [] as readonly string[]);
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith("tz:lastPoints:"))).catch(() => {});
    Alert.alert(tr("Готово"), tr("Кэш очищен."));
  };

  const version = [Constants.expoConfig?.version ?? "1.0.0", Updates.updateId ? Updates.updateId.slice(0, 8) : null]
    .filter(Boolean)
    .join(" · ");

  const deleteAccount = () => {
    Alert.alert(
      tr("Удалить аккаунт?"),
      tr("Будут удалены профиль, очки, заявки и фотографии. Это нельзя отменить."),
      [
        { text: tr("Отмена"), style: "cancel" },
        {
          text: tr("Удалить"),
          style: "destructive",
          onPress: async () => {
            const { data: s } = await supabase.auth.getSession();
            const uid = s.session?.user.id;
            if (uid) {
              const { data: files } = await supabase.storage.from("submissions").list(uid, { limit: 1000 });
              if (files && files.length > 0) {
                await supabase.storage.from("submissions").remove(files.map((f) => `${uid}/${f.name}`));
              }
              const { data: avatars } = await supabase.storage.from("avatars").list(uid, { limit: 100 });
              if (avatars && avatars.length > 0) {
                await supabase.storage.from("avatars").remove(avatars.map((f) => `${uid}/${f.name}`));
              }
            }
            const { error } = await supabase.rpc("delete_my_account");
            if (error) {
              Alert.alert(tr("Ошибка"), trs(error.message));
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
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1">{tr("Настройки")}</AppText>

      <SectionHeader title={tr("Внешний вид")} />
      <View style={[s.group, s.pad]}>
        <AppText variant="bodyStrong">{tr("Язык")}</AppText>
        <View style={s.chips}>
          <Chip label="Қазақша" active={current === "kk"} onPress={() => pickLang("kk")} />
          <Chip label="Русский" active={current === "ru"} onPress={() => pickLang("ru")} />
        </View>
        <AppText variant="bodyStrong" style={{ marginTop: space.x4 }}>
          {tr("Тема")}
        </AppText>
        <View style={s.chips}>
          <Chip label={tr("Как в телефоне")} active={theme === "system"} onPress={() => pickTheme("system")} />
          <Chip label={tr("Светлая")} active={theme === "light"} onPress={() => pickTheme("light")} />
          <Chip label={tr("Тёмная")} active={theme === "dark"} onPress={() => pickTheme("dark")} />
        </View>
      </View>

      <SectionHeader title={tr("Конфиденциальность")} />
      <View style={s.group}>
        <ListRow
          first
          title={tr("Политика конфиденциальности")}
          subtitle={tr("какие данные мы храним и кто их видит")}
          leading={
            <RowIcon>
              <Icon name="lock-closed-outline" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={() => router.push("/privacy")}
        />
      </View>

      <SectionHeader title={tr("О приложении и помощь")} />
      <View style={s.group}>
        <ListRow
          first
          title={tr("Правила сообщества")}
          subtitle={tr("как вести себя в заданиях и чатах")}
          leading={
            <RowIcon>
              <Icon name="shield-checkmark-outline" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={() => Alert.alert(tr("Правила сообщества"), RULES.map((r, i) => `${i + 1}. ${tr(r)}`).join("\n\n"))}
        />
        <ListRow
          title={tr("Написать в поддержку")}
          subtitle={SUPPORT}
          leading={
            <RowIcon>
              <Icon name="chatbubble-outline" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={() => Linking.openURL(`mailto:${SUPPORT}?subject=TazaNiyet`)}
        />
        <ListRow
          title={tr("Сайт приложения")}
          subtitle={tr("скачать APK и рассказать друзьям")}
          leading={
            <RowIcon>
              <Icon name="open-outline" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={() => Linking.openURL(SITE)}
        />
        <ListRow
          title={tr("Очистить кэш")}
          subtitle={tr("сохранённые ссылки на фото")}
          leading={
            <RowIcon>
              <Icon name="refresh" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={clearCache}
        />
        <ListRow
          title={tr("Версия")}
          subtitle={version}
          leading={
            <RowIcon>
              <Icon name="information-circle-outline" size={20} color={color.forest} />
            </RowIcon>
          }
        />
      </View>

      <SectionHeader title={tr("Опасная зона")} />
      <View style={s.group}>
        <ListRow
          first
          danger
          title={tr("Удалить аккаунт и все данные")}
          leading={
            <RowIcon tint={color.dangerSoft}>
              <Icon name="trash-outline" size={20} color={color.danger} />
            </RowIcon>
          }
          onPress={deleteAccount}
        />
      </View>
      <AppText variant="caption" style={{ marginTop: space.x2 }}>{tr("Удаляются профиль, очки, заявки и фотографии. Отменить это нельзя.")}</AppText>
    </Screen>
  );
}

const s = StyleSheet.create({
  group: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    paddingHorizontal: space.x4,
  },
  pad: { paddingVertical: space.x4 },
  chips: { flexDirection: "row", flexWrap: "wrap", rowGap: space.x2, marginTop: space.x2 },
});
