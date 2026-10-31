import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { ListRow, RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { supabase } from "../lib/supabase";
import { color, radius, space } from "../lib/theme";

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
              const { data: avatars } = await supabase.storage.from("avatars").list(uid, { limit: 100 });
              if (avatars && avatars.length > 0) {
                await supabase.storage.from("avatars").remove(avatars.map((f) => `${uid}/${f.name}`));
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
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1">Настройки</AppText>

      <SectionHeader title="Конфиденциальность" />
      <View style={s.group}>
        <ListRow
          first
          title="Политика конфиденциальности"
          subtitle="какие данные мы храним и кто их видит"
          leading={
            <RowIcon>
              <Ionicons name="lock-closed-outline" size={20} color={color.forest} />
            </RowIcon>
          }
          onPress={() => router.push("/privacy")}
        />
      </View>

      <SectionHeader title="Опасная зона" />
      <View style={s.group}>
        <ListRow
          first
          danger
          title="Удалить аккаунт и все данные"
          leading={
            <RowIcon tint={color.dangerSoft}>
              <Ionicons name="trash-outline" size={20} color={color.danger} />
            </RowIcon>
          }
          onPress={deleteAccount}
        />
      </View>
      <AppText variant="caption" style={{ marginTop: space.x2 }}>
        Удаляются профиль, очки, заявки и фотографии. Отменить это нельзя.
      </AppText>
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
});
