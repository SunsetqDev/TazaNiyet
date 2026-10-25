import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

const GREEN = "#1F7A4D";

const SECTIONS = [
  ["Какие данные мы собираем", "Имя, почту, год рождения, область и название населённого пункта, фотографии выполненных заданий, очки TZ. Для пользователей до 14 лет также имя и контакт родителя."],
  ["Зачем", "Чтобы проверять задания, начислять очки TZ, показывать задания рядом с вами и создавать портфолио волонтёрской активности."],
  ["Кто видит данные", "Фотографии заданий видят только вы и проверяющие. В рейтинге показывается только имя без фамилии. Пользователи до 14 лет в рейтинге отображаются как «Участник». Портфолио видит только тот, кому вы сами дали код, и там нет фотографий."],
  ["Дети", "Для пользователей до 14 лет нужно согласие родителей или законных представителей. Без подтверждённого согласия отправка заданий недоступна."],
  ["Безопасность фото", "Не снимайте лица людей, особенно детей, и не фотографируйте документы. Снимайте только место и результат работы."],
  ["Хранение и удаление", "Вы можете удалить аккаунт в разделе «Настройки». Будут удалены профиль, заявки и фотографии. Мы не продаём и не передаём ваши данные рекламодателям."],
  ["Контакты", "По вопросам данных пишите: Rusuafflex@gmail.com"],
];

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Политика конфиденциальности</Text>
      {SECTIONS.map(([h, t]) => (
        <Text key={h} style={styles.block}>
          <Text style={styles.h}>{h}{"\n"}</Text>
          {t}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 50 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#1C2B23", marginBottom: 16 },
  block: { color: "#3F4F46", lineHeight: 22, marginBottom: 16, fontSize: 15 },
  h: { fontWeight: "800", color: "#1C2B23", fontSize: 16 },
});