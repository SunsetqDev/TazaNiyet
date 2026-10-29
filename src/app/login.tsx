import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, space } from "../lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert("Заполните все поля");
      return;
    }
    setLoading(true);
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    router.replace("/");
  };

  return (
    <Screen bottomInset contentStyle={s.content}>
      <View style={s.mark}>
        <Ionicons name="leaf" size={30} color={color.forest} />
      </View>
      <AppText variant="display" color={color.forest}>
        TazaNiyet
      </AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x8 }}>
        {isSignUp ? "Создайте аккаунт и начните с первого задания" : "Войдите, чтобы продолжить"}
      </AppText>

      {isSignUp && <TextField label="Имя" placeholder="Как вас зовут" value={name} onChangeText={setName} autoComplete="name" />}
      <TextField
        label="Почта"
        placeholder="name@mail.kz"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Пароль"
        placeholder="Минимум 6 символов"
        secureTextEntry
        autoComplete={isSignUp ? "new-password" : "current-password"}
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={submit}
      />

      <Button label={isSignUp ? "Зарегистрироваться" : "Войти"} onPress={submit} loading={loading} style={{ marginTop: space.x2 }} />
      <Button
        label={isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
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
