import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressScale } from "../../components/anim";
import { AppText } from "../../components/ui/app-text";
import { Button } from "../../components/ui/button";
import { Chip } from "../../components/ui/chip";
import { getCurrentCoords, KZ_REGION, REPORT_CATEGORIES, reportCategory } from "../../lib/reports";
import { DIFFICULTY, distanceM, formatDistance, openRoute, type MapTask } from "../../lib/spot-tasks";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";

type Me = { lat: number; lng: number } | null;

// маркер: свободное — тёмно-зелёное, моё — лаймовое, занятое другим — серое
function Pin({ t }: { t: MapTask }) {
  const busy = t.status !== "available" && !t.is_mine;
  const bg = t.is_mine ? color.lime : busy ? color.faint : color.forest;
  const fg = t.is_mine ? color.forest : color.onForest;
  return (
    <View style={s.pinWrap}>
      <View style={[s.pin, { backgroundColor: bg }]}>
        <Ionicons name={reportCategory(t.category).icon} size={18} color={fg} />
      </View>
      <View style={[s.pinTail, { borderTopColor: bg }]} />
    </View>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [tasks, setTasks] = useState<MapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cat, setCat] = useState("all");
  const [me, setMe] = useState<Me>(null);
  const [locAllowed, setLocAllowed] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<MapTask | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [pinsReady, setPinsReady] = useState(false);
  const centered = useRef(false);

  const load = useCallback(async () => {
    setError(false);
    const { data, error } = await supabase.rpc("get_map_tasks");
    if (error) setError(true);
    else setTasks((data ?? []) as MapTask[]);
    setLoading(false);
  }, []);

  // местоположение: спрашиваем только если ещё не решено; отказ — карта работает и без него
  const findMe = useCallback(async (ask: boolean) => {
    const perm = ask ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
    setLocAllowed(perm.granted);
    if (!perm.granted) return null;
    const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({}).catch(() => null));
    if (!pos) return null;
    const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setMe(p);
    return p;
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      findMe(false);
    }, [load, findMe])
  );

  // один раз центрируем карту: на себя, иначе на ближайшие задания
  useEffect(() => {
    if (centered.current || loading) return;
    const target = me ?? (tasks[0] ? { lat: tasks[0].lat, lng: tasks[0].lng } : null);
    if (!target) return;
    centered.current = true;
    map.current?.animateToRegion({ latitude: target.lat, longitude: target.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
  }, [me, tasks, loading]);

  // кастомные маркеры на Android перерисовываются постоянно, пока tracksViewChanges = true — отключаем после первой отрисовки
  useEffect(() => {
    setPinsReady(false);
    const id = setTimeout(() => setPinsReady(true), 600);
    return () => clearTimeout(id);
  }, [tasks, cat]);

  useEffect(() => {
    setThumb(null);
    if (!selected?.photo_path) return;
    let alive = true;
    supabase.storage
      .from("reports")
      .createSignedUrl(selected.photo_path, 3600)
      .then(({ data }) => alive && setThumb(data?.signedUrl ?? null));
    return () => {
      alive = false;
    };
  }, [selected?.id]);

  const shown = useMemo(() => tasks.filter((t) => cat === "all" || t.category === cat), [tasks, cat]);
  const available = tasks.filter((t) => t.status === "available").length;

  const locate = async () => {
    const p = me ?? (await findMe(true));
    const c = p ?? (await getCurrentCoords());
    if (c) map.current?.animateToRegion({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
  };

  const dist = selected && me ? distanceM(me.lat, me.lng, selected.lat, selected.lng) : null;

  return (
    <View style={{ flex: 1, backgroundColor: color.cream }}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={KZ_REGION}
        showsUserLocation={!!locAllowed}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => setSelected(null)}
        mapPadding={{ top: insets.top + 110, right: 0, bottom: selected ? 230 : 0, left: 0 }}
      >
        {shown.map((t) => (
          <Marker
            key={t.id}
            coordinate={{ latitude: t.lat, longitude: t.lng }}
            onPress={(e) => {
              e.stopPropagation();
              setSelected(t);
            }}
            tracksViewChanges={!pinsReady}
            anchor={{ x: 0.5, y: 1 }}
          >
            <Pin t={t} />
          </Marker>
        ))}
      </MapView>

      {/* шапка с фильтрами */}
      <View style={[s.top, { paddingTop: insets.top + space.x2 }]} pointerEvents="box-none">
        <View style={s.titleBar}>
          <View style={{ flex: 1 }}>
            <AppText variant="h2">Карта заданий</AppText>
            <AppText variant="caption">
              {loading ? "Загружаем…" : available > 0 ? `Доступно мест для уборки: ${available}` : "Свободных мест пока нет"}
            </AppText>
          </View>
          <PressScale onPress={load} scaleTo={0.9} style={s.iconBtn}>
            <Ionicons name="refresh" size={20} color={color.ink} />
          </PressScale>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter }} style={{ marginTop: space.x2 }}>
          <Chip label="Все" active={cat === "all"} onPress={() => setCat("all")} />
          {REPORT_CATEGORIES.map((c) => (
            <Chip key={c.k} label={c.label} active={cat === c.k} onPress={() => setCat(c.k)} />
          ))}
        </ScrollView>
      </View>

      {/* кнопки справа */}
      <View style={[s.side, { bottom: selected ? 250 : space.x6 + 60 }]}>
        <PressScale onPress={locate} scaleTo={0.9} style={s.fab}>
          <Ionicons name="locate" size={22} color={color.forest} />
        </PressScale>
      </View>

      {loading && (
        <View style={s.center} pointerEvents="none">
          <View style={s.pill}>
            <ActivityIndicator color={color.forest} />
            <AppText variant="bodyStrong">Загружаем задания…</AppText>
          </View>
        </View>
      )}

      {!loading && error && (
        <View style={s.bottom}>
          <View style={s.sheet}>
            <AppText variant="h3">Не удалось загрузить карту заданий</AppText>
            <AppText variant="body" color={color.muted}>
              Проверьте интернет и попробуйте ещё раз.
            </AppText>
            <Button label="Повторить" variant="secondary" onPress={load} style={{ marginTop: space.x3 }} />
          </View>
        </View>
      )}

      {!loading && !error && !selected && shown.length === 0 && (
        <View style={s.bottom}>
          <View style={s.sheet}>
            <AppText variant="h3">{tasks.length === 0 ? "На карте пока нет заданий" : "В этой категории пусто"}</AppText>
            <AppText variant="body" color={color.muted}>
              Задания появляются из заявок жителей после проверки. Заметили мусор — сообщите о нём.
            </AppText>
            <Button label="Сообщить о загрязнении" icon="camera-outline" onPress={() => router.push("/report")} style={{ marginTop: space.x3 }} />
          </View>
        </View>
      )}

      {!loading && !error && !selected && shown.length > 0 && locAllowed === false && (
        <View style={s.bottom}>
          <PressScale onPress={() => findMe(true)} scaleTo={0.98} style={s.hint}>
            <Ionicons name="navigate-outline" size={18} color={color.forest} />
            <AppText variant="body" style={{ flex: 1 }}>
              Разрешите геолокацию, чтобы видеть себя на карте и расстояние до мест
            </AppText>
          </PressScale>
        </View>
      )}

      {selected && (
        <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOutDown.duration(180)} style={s.bottom}>
          <View style={s.sheet}>
            <View style={s.cardTop}>
              {thumb ? (
                <Image source={{ uri: thumb }} style={s.thumb} />
              ) : (
                <View style={[s.thumb, s.noThumb]}>
                  <Ionicons name={reportCategory(selected.category).icon} size={24} color={color.muted} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="h3" numberOfLines={2}>
                  {selected.title}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {[DIFFICULTY[selected.difficulty]?.label, dist !== null ? formatDistance(dist) : null, selected.address].filter(Boolean).join(" · ")}
                </AppText>
                <View style={s.ptsPill}>
                  <AppText style={s.ptsText}>+{selected.points} TZ</AppText>
                </View>
              </View>
              <PressScale onPress={() => setSelected(null)} scaleTo={0.9} style={s.close}>
                <Ionicons name="close" size={18} color={color.muted} />
              </PressScale>
            </View>
            {selected.status !== "available" && !selected.is_mine && (
              <AppText variant="caption" style={{ marginTop: space.x2 }}>
                Это место уже убирает другой участник.
              </AppText>
            )}
            {selected.is_mine && (
              <AppText variant="caption" color={color.forest} style={{ marginTop: space.x2 }}>
                {selected.status === "under_review" ? "Ваш результат на проверке." : "Это задание за вами."}
              </AppText>
            )}
            <View style={s.actions}>
              <Button label="Маршрут" icon="navigate-outline" variant="secondary" onPress={() => openRoute(selected.lat, selected.lng)} style={{ flex: 1 }} />
              <Button
                label="Подробнее"
                onPress={() => router.push({ pathname: "/spot/[id]", params: { id: String(selected.id) } })}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x3,
    marginHorizontal: space.gutter,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: space.x3,
    paddingHorizontal: space.x4,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.cream, alignItems: "center", justifyContent: "center" },
  side: { position: "absolute", right: space.gutter },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  bottom: { position: "absolute", left: space.gutter, right: space.gutter, bottom: space.x4 },
  sheet: { backgroundColor: color.surface, borderRadius: radius.hero, borderWidth: 1, borderColor: color.line, padding: space.x4, gap: 4 },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x3,
  },
  cardTop: { flexDirection: "row", gap: space.x3, alignItems: "flex-start" },
  thumb: { width: 76, height: 76, borderRadius: 18, backgroundColor: color.sand },
  noThumb: { alignItems: "center", justifyContent: "center" },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.cream, alignItems: "center", justifyContent: "center" },
  ptsPill: { alignSelf: "flex-start", backgroundColor: color.forest, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  ptsText: { fontFamily: font.bold, fontSize: 12, color: color.lime },
  actions: { flexDirection: "row", gap: space.x2, marginTop: space.x3 },
  pinWrap: { alignItems: "center" },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: color.surface,
  },
  pinTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
