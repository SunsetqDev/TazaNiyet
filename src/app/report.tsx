import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressScale } from "../components/anim";
import { OsmMap, type OsmMapHandle } from "../components/osm-map";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { TextField } from "../components/ui/text-field";
import { pickPhoto, takePhoto, uploadPhoto, type Photo } from "../lib/photos";
import { addressFor, getCurrentCoords, inKazakhstan, KZ_CENTER, KZ_ZOOM, REPORT_CATEGORIES, type Coords } from "../lib/reports";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

const MAX_PHOTOS = 3;

export default function ReportScreen() {
  const router = useRouter();
  const map = useRef<OsmMapHandle>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [manual, setManual] = useState(false);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [nearby, setNearby] = useState(0);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<number | null>(null);

  // при каждой смене точки — адрес-подсказка и проверка, нет ли рядом такой же заявки
  useEffect(() => {
    if (!coords) return;
    let alive = true;
    addressFor(coords.lat, coords.lng).then((a) => alive && setAddress(a));
    supabase
      .rpc("count_nearby_reports", { p_lat: coords.lat, p_lng: coords.lng, p_radius_m: 50 })
      .then(({ data }) => alive && setNearby(typeof data === "number" ? data : 0));
    return () => {
      alive = false;
    };
  }, [coords?.lat, coords?.lng]);

  const addPhoto = async (from: "camera" | "gallery") => {
    const p = from === "camera" ? await takePhoto() : await pickPhoto();
    if (p) setPhotos((list) => [...list, p].slice(0, MAX_PHOTOS));
  };

  const locate = async () => {
    setLocating(true);
    const c = await getCurrentCoords();
    setLocating(false);
    if (!c) return;
    if (!inKazakhstan(c.lat, c.lng)) {
      Alert.alert("Место вне Казахстана", "Заявки принимаются только по Казахстану. Отметьте точку на карте вручную.");
      return;
    }
    setCoords(c);
    setManual(false);
    map.current?.flyTo({ lat: c.lat, lng: c.lng }, 17);
  };

  const moveTo = (lat: number, lng: number) => {
    if (!inKazakhstan(lat, lng)) return;
    setCoords({ lat, lng, accuracy: null });
  };

  const desc = description.trim();
  const missing =
    photos.length === 0
      ? "Добавьте хотя бы одно фото"
      : !category
      ? "Выберите, что случилось"
      : desc.length < 5
      ? "Опишите проблему (от 5 символов)"
      : !coords
      ? "Укажите место"
      : null;

  const submit = async () => {
    if (missing) {
      Alert.alert("Почти готово", missing);
      return;
    }
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const paths: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        paths.push(await uploadPhoto("reports", photos[i], user.id, `report-${i}`));
      }
      const { data, error } = await supabase.rpc("submit_report", {
        p_category: category,
        p_description: desc,
        p_photo_paths: paths,
        p_lat: coords!.lat,
        p_lng: coords!.lng,
        p_accuracy: coords!.accuracy,
        p_address: address || null,
      });
      if (error) throw error;
      setSentId(Number(data));
    } catch (e: any) {
      Alert.alert("Не удалось отправить", e?.message ?? "Проверьте интернет и попробуйте снова.");
    } finally {
      setSending(false);
    }
  };

  if (sentId !== null) {
    return (
      <Screen bottomInset contentStyle={s.doneWrap}>
        <Animated.View entering={FadeInDown.duration(320)} style={s.done}>
          <View style={s.doneIcon}>
            <Ionicons name="checkmark" size={32} color={color.forest} />
          </View>
          <AppText variant="h1" style={{ textAlign: "center" }}>
            Заявка отправлена
          </AppText>
          <AppText variant="body" color={color.muted} style={{ textAlign: "center" }}>
            Модератор проверит фото и место. После подтверждения оно появится на карте как задание, а вы получите +10 TZ.
          </AppText>
          <Button label="Мои заявки" onPress={() => router.replace("/my-reports")} style={s.doneBtn} />
          <Button label="На главную" variant="ghost" onPress={() => router.replace("/")} />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset
      footer={
        <View style={{ gap: space.x2 }}>
          {missing ? (
            <AppText variant="caption" style={{ textAlign: "center" }}>
              {missing}
            </AppText>
          ) : null}
          <Button label="Отправить заявку" icon="paper-plane-outline" onPress={submit} loading={sending} />
        </View>
      }
    >
      <BackButton />
      <AppText variant="h1">Сообщить о загрязнении</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1 }}>
        Сфотографируйте место и отметьте его на карте. После проверки оно станет заданием для других участников.
      </AppText>

      <SectionHeader title="Фото" hint={`${photos.length} из ${MAX_PHOTOS}`} />
      <View style={s.photos}>
        {photos.map((p, i) => (
          <View key={p.uri} style={s.thumb}>
            <Image source={{ uri: p.uri }} style={s.thumbImg} />
            <Pressable
              hitSlop={8}
              style={s.remove}
              onPress={() => setPhotos((list) => list.filter((_, j) => j !== i))}
              accessibilityLabel="Убрать фото"
            >
              <Ionicons name="close" size={16} color={color.onForest} />
            </Pressable>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <View style={s.addCol}>
            <PressScale onPress={() => addPhoto("camera")} scaleTo={0.96} style={s.addBtn}>
              <Ionicons name="camera-outline" size={22} color={color.forest} />
              <AppText style={s.addText}>Камера</AppText>
            </PressScale>
            <PressScale onPress={() => addPhoto("gallery")} scaleTo={0.96} style={s.addBtn}>
              <Ionicons name="images-outline" size={22} color={color.forest} />
              <AppText style={s.addText}>Галерея</AppText>
            </PressScale>
          </View>
        )}
      </View>
      <View style={s.note}>
        <Ionicons name="eye-off-outline" size={14} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Снимайте только место — без лиц людей, номеров машин и документов.
        </AppText>
      </View>

      <SectionHeader title="Что случилось" />
      <View style={s.cats}>
        {REPORT_CATEGORIES.map((c) => {
          const on = category === c.k;
          return (
            <PressScale key={c.k} onPress={() => setCategory(c.k)} scaleTo={0.96} style={[s.cat, on && s.catOn]}>
              <Ionicons name={c.icon} size={20} color={on ? color.lime : color.forest} />
              <AppText style={s.catText} color={on ? color.onForest : color.ink} numberOfLines={2}>
                {c.label}
              </AppText>
            </PressScale>
          );
        })}
      </View>

      <View style={{ marginTop: space.x5 }}>
        <TextField
          label="Описание"
          placeholder="Например: пакеты с мусором у скамеек возле детской площадки"
          multiline
          maxLength={500}
          value={description}
          onChangeText={setDescription}
          hint={`${desc.length} / 500`}
          style={{ minHeight: 96, textAlignVertical: "top" }}
        />
      </View>

      <SectionHeader title="Где это" />
      {!coords && !manual ? (
        <View style={s.locCard}>
          <Button label="Определить по GPS" icon="locate-outline" variant="secondary" onPress={locate} loading={locating} />
          <Button label="Отметить на карте вручную" variant="ghost" onPress={() => setManual(true)} />
        </View>
      ) : (
        <>
          <OsmMap
            ref={map}
            style={s.mapBox}
            center={coords ?? KZ_CENTER}
            zoom={coords ? 17 : KZ_ZOOM}
            markers={coords ? [{ id: "point", lat: coords.lat, lng: coords.lng, kind: "point" }] : []}
            draggable
            onPress={(p) => moveTo(p.lat, p.lng)}
            onMarkerDrag={(p) => moveTo(p.lat, p.lng)}
          />
          <View style={s.locInfo}>
            <Ionicons name="location" size={16} color={color.forest} />
            <AppText variant="body" style={{ flex: 1 }}>
              {coords ? address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Нажмите на карту, чтобы поставить метку"}
            </AppText>
          </View>
          <AppText variant="caption">
            {coords?.accuracy ? `Точность GPS ±${Math.round(coords.accuracy)} м. ` : ""}
            Если метка стоит неточно — перетащите её или нажмите на нужное место.
          </AppText>
          <Button label="Обновить по GPS" icon="locate-outline" variant="ghost" onPress={locate} loading={locating} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />
          {nearby > 0 && (
            <View style={s.warn}>
              <Ionicons name="alert-circle-outline" size={18} color={color.warn} />
              <AppText variant="body" color={color.warn} style={{ flex: 1 }}>
                Рядом уже есть заявка ({nearby}). Если это то же место, отправлять повторно не нужно.
              </AppText>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  photos: { flexDirection: "row", gap: space.x2 },
  thumb: { width: 96, height: 128, borderRadius: radius.field, overflow: "hidden", backgroundColor: color.sand },
  thumbImg: { width: "100%", height: "100%" },
  remove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(21,61,44,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  addCol: { flex: 1, gap: space.x2, minHeight: 128 },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.x2,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  addText: { fontFamily: font.semibold, fontSize: 14, color: color.forest },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.x3 },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: space.x2 },
  cat: {
    width: "48.5%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    paddingHorizontal: space.x3,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  catOn: { backgroundColor: color.forest, borderColor: color.forest },
  catText: { flex: 1, fontFamily: font.semibold, fontSize: 13, lineHeight: 17 },
  locCard: {
    gap: space.x1,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x4,
  },
  mapBox: { height: 240, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.sand },
  locInfo: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: space.x3, marginBottom: space.x1 },
  warn: {
    flexDirection: "row",
    gap: space.x2,
    backgroundColor: color.warnSoft,
    borderRadius: radius.field,
    padding: space.x3,
    marginTop: space.x2,
  },
  doneWrap: { flexGrow: 1, justifyContent: "center" },
  done: { alignItems: "center", gap: space.x3 },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: color.lime, alignItems: "center", justifyContent: "center" },
  doneBtn: { alignSelf: "stretch", marginTop: space.x3 },
});
