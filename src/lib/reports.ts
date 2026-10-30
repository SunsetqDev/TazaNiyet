import type { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Alert } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Категории загрязнения — те же ключи, что в ограничении reports.category в базе. */
export const REPORT_CATEGORIES: { k: string; label: string; icon: IconName }[] = [
  { k: "park", label: "Мусор в парке", icon: "leaf-outline" },
  { k: "dump", label: "Стихийная свалка", icon: "trash-bin-outline" },
  { k: "road", label: "Мусор у дороги", icon: "car-outline" },
  { k: "river", label: "Загрязнение у воды", icon: "water-outline" },
  { k: "yard", label: "Двор или улица", icon: "home-outline" },
  { k: "other", label: "Другое", icon: "ellipsis-horizontal" },
];

export const reportCategory = (k: string) => REPORT_CATEGORIES.find((c) => c.k === k) ?? REPORT_CATEGORIES[5];

export type Coords = { lat: number; lng: number; accuracy: number | null };

/** Центр Казахстана — карта по умолчанию, если GPS недоступен. */
export const KZ_REGION = { latitude: 48.0, longitude: 67.0, latitudeDelta: 18, longitudeDelta: 18 };

/** Текущие координаты с проверкой разрешения и включённого GPS. null — пользователю уже объяснили причину. */
export async function getCurrentCoords(): Promise<Coords | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Нет доступа к местоположению", "Разрешите геолокацию в настройках телефона или отметьте место на карте вручную.");
    return null;
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    Alert.alert("Геолокация выключена", "Включите местоположение в шторке телефона или отметьте место на карте вручную.");
    return null;
  }
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
  } catch {
    Alert.alert("Не удалось определить место", "Выйдите на открытое место и попробуйте ещё раз или отметьте точку на карте.");
    return null;
  }
}

/** Подсказка-адрес по координатам (геокодер Android). Пустая строка, если не получилось. */
export async function addressFor(lat: number, lng: number) {
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!a) return "";
    const street = [a.street, a.streetNumber].filter(Boolean).join(", ");
    return [a.city ?? a.subregion ?? a.region, street || a.name].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}

/** Казахстан грубо: такие же границы проверяет база. */
export const inKazakhstan = (lat: number, lng: number) => lat >= 40 && lat <= 56 && lng >= 46 && lng <= 88;
