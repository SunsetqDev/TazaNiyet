import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

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
    <View style={styles.screen}>
      <Text style={styles.logo}>TazaNiyet</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? "Создайте аккаунт" : "Войдите в аккаунт"}
      </Text>

      {isSignUp && (
        <TextInput style={styles.input} placeholder="Имя" value={name} onChangeText={setName} />
      )}
      <TextInput
        style={styles.input}
        placeholder="Почта"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Пароль (минимум 6 символов)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? "Зарегистрироваться" : "Войти"}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.link}>
          {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA", padding: 24, justifyContent: "center" },
  logo: { fontSize: 38, fontWeight: "800", color: GREEN },
  subtitle: { fontSize: 16, color: "#5B6B62", marginBottom: 24, marginTop: 4 },
  input: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDE5DF",
  },
  button: { backgroundColor: GREEN, borderRadius: 14, padding: 18, alignItems: "center", marginTop: 4 },
  buttonText: { color: "white", fontSize: 17, fontWeight: "700" },
  link: { color: GREEN, textAlign: "center", marginTop: 20, fontWeight: "600" },
});