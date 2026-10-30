import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { supabase } from "./supabase";

export type Photo = { uri: string; base64: string };

const OPTIONS = { quality: 0.5, base64: true } as const;

function toPhoto(result: ImagePicker.ImagePickerResult): Photo | null {
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64 || asset.base64.length < 1000) {
    Alert.alert("Фото не получилось", "Попробуйте ещё раз.");
    return null;
  }
  return { uri: asset.uri, base64: asset.base64 };
}

/** Снимок с камеры. null — отмена, нет разрешения или пустое фото (пользователю уже показано сообщение). */
export async function takePhoto(): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Нужен доступ к камере", "Разрешите камеру в настройках телефона.");
    return null;
  }
  return toPhoto(await ImagePicker.launchCameraAsync(OPTIONS));
}

/** Фото из галереи (системный выбор фото Android, отдельное разрешение не нужно). */
export async function pickPhoto(): Promise<Photo | null> {
  return toPhoto(await ImagePicker.launchImageLibraryAsync({ ...OPTIONS, mediaTypes: ["images"] }));
}

/** Загружает фото в бакет по пути `<userId>/<время>-<label>.jpg` и возвращает путь. */
export async function uploadPhoto(bucket: string, photo: Photo, userId: string, label: string) {
  const path = `${userId}/${Date.now()}-${label}.jpg`;
  const bytes = decode(photo.base64);
  if (bytes.byteLength < 1000) {
    throw new Error("Фото пустое. Сделайте его заново.");
  }
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}
