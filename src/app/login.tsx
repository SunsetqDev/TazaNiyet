import { Icon } from "../components/icon";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, space } from "../lib/theme";
import { tr, trs } from "../lib/i18n";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert(tr("Заполните все поля"));
      return;
    }
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert(tr("Ошибка"), trs(error.message));
      return;
    }
    router.replace("/");
  };

  return (
    <Screen bottomInset contentStyle={s.content}>
      <View style={s.mark}>
        <Icon name="leaf" size={30} color={color.forest} />
      </View>
      <AppText variant="display" color={color.forest}>
        TazaNiyet
      </AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x8 }}>
        {isSignUp ? tr("Создайте аккаунт и начните с первого задания") : tr("Войдите, чтобы продолжить")}
      </AppText>

      {isSignUp && <TextField label={tr("Имя")} placeholder={tr("Как вас зовут")} value={name} onChangeText={setName} autoComplete="name" />}
      <TextField
        label={tr("Почта")}
        placeholder="name@mail.kz"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label={tr("Пароль")}
        placeholder={tr("Минимум 6 символов")}
        secureTextEntry
        autoComplete={isSignUp ? "new-password" : "current-password"}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />

      <Button label={isSignUp ? tr("Зарегистрироваться") : tr("Войти")} onPress={submit} loading={loading} style={{ marginTop: space.x2 }} />
      <Button
        label={isSignUp ? tr("Уже есть аккаунт? Войти") : tr("Нет аккаунта? Зарегистрироваться")}
        variant="ghost"
        onPress={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: space.x2 }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "center" },
  mark: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: color.lime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.x5,
  },
});
