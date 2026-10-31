import { Linking } from "react-native";

/** Задание на карте (то, что отдаёт RPC get_map_tasks). */
export type MapTask = {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  lat: number;
  lng: number;
  address: string | null;
  status: string;
  photo_path: string | null;
  is_mine: boolean;
  is_my_report: boolean;
  created_at: string;
};

/** Подробности задания (RPC get_spot_task). */
export type SpotTask = {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points: number;
  lat: number;
  lng: number;
  address: string | null;
  place_name: string | null;
  photo_paths: string[];
  status: string;
  created_at: string;
  completed_at: string | null;
  author_name: string;
  is_my_report: boolean;
  is_mine: boolean;
  claim_expires_at: string | null;
  last_reject_reason: string | null;
  /** текущий пользователь — модератор (может снять свободное задание с карты) */
  can_moderate: boolean;
};

export const DIFFICULTY: Record<string, { label: string; points: number }> = {
  easy: { label: "Лёгкое", points: 30 },
  medium: { label: "Среднее", points: 60 },
  hard: { label: "Сложное", points: 100 },
};

/** Подпись статуса задания на карте. */
export const SPOT_STATUS: Record<string, string> = {
  available: "Доступно",
  in_progress: "Выполняется",
  under_review: "Результат на проверке",
  completed: "Выполнено",
  cancelled: "Снято",
};

/** Радиус, в котором принимается фото результата (тот же, что проверяет сервер). */
export const RESULT_RADIUS_M = 200;

/** Расстояние в метрах между двумя точками (формула гаверсинуса). */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} м`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace(".", ",")} км`;
}

/** Сколько осталось до конца брони: «47 ч», «35 мин». */
export function timeLeft(iso: string | null) {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "время вышло";
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `${h} ч` : `${Math.max(1, Math.round(ms / 60000))} мин`;
}

/** Маршрут пешком в Google Картах; если приложения нет — откроется сайт карт. */
export async function openRoute(lat: number, lng: number) {
  const app = `google.navigation:q=${lat},${lng}&mode=w`;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  try {
    if (await Linking.canOpenURL(app)) return await Linking.openURL(app);
  } catch {}
  return Linking.openURL(web);
}
