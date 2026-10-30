// Основная конфигурация — в app.json. Здесь только то, что нельзя хранить в репозитории:
// ключ Google Maps для Android-сборки берётся из переменной окружения EAS (GOOGLE_MAPS_API_KEY).
// Без ключа карта работает в Expo Go, но в APK будет серой.
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  return {
    ...config,
    plugins: [...(config.plugins ?? []), ["react-native-maps", key ? { androidGoogleMapsApiKey: key } : {}]],
  };
};
