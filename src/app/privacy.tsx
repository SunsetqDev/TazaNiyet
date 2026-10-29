import { StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Screen } from "../components/ui/screen";
import { color, space } from "../lib/theme";

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
  return (
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1">Политика конфиденциальности</AppText>
      <View style={{ marginTop: space.x4 }}>
        {SECTIONS.map(([h, t], i) => (
          <View key={h} style={[s.block, i > 0 && s.line]}>
            <AppText variant="h3">{h}</AppText>
            <AppText variant="body" color={color.ink} style={{ marginTop: space.x1 }}>
              {t}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  block: { paddingVertical: space.x4 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
});
