import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { OsmMap } from "../../components/osm-map";
import { Alert, Image, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText } from "../../components/ui/app-text";
import { BackButton } from "../../components/ui/back-button";
import { Button } from "../../components/ui/button";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton, SkeletonCard } from "../../components/ui/skeleton";
import { StatusPill } from "../../components/ui/status-pill";
import { takePhoto, uploadPhoto } from "../../lib/photos";
import { getCurrentCoords, reportCategory } from "../../lib/reports";
import { DIFFICULTY, distanceM, formatDistance, openRoute, RESULT_RADIUS_M, timeLeft, type SpotTask } from "../../lib/spot-tasks";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";

function Fact({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <View style={s.fact}>
      <Ionicons name={icon} size={16} color={color.forest} />
      <AppText style={s.factText}>{text}</AppText>
    </View>
  );
}

function Note({ icon, text, tone = "neutral" }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string; tone?: "neutral" | "warn" | "danger" }) {
  const fg = tone === "warn" ? color.warn : tone === "danger" ? color.danger : color.forest;
  const bg = tone === "warn" ? color.warnSoft : tone === "danger" ? color.dangerSoft : color.limeSoft;
  return (
    <View style={[s.note, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} />
      <AppText variant="body" color={tone === "neutral" ? color.ink : fg} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

/** Подробная страница задания на карте: фото, место, маршрут, принять / результат / отказаться. */
export default function SpotTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [t, setT] = useState<SpotTask | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dist, setDist] = useState<number | null>(null);
  const [busy, setBusy] = useState<"claim" | "result" | "release" | null>(null);

  const load = useCallback(async () => {
    setError(false);
    const { data, error } = await supabase.rpc("get_spot_task", { p_id: Number(id) });
    if (error) {
      setError(true);
      setLoading(false);
      return;
    }
    const task = (data as SpotTask | null) ?? null;
    setT(task);
    if (task?.photo_paths?.length) {
      const { data: signed } = await supabase.storage.from("reports").createSignedUrls(task.photo_paths, 3600);
      setUrls((signed ?? []).map((x) => x.signedUrl).filter((x): x is string => !!x));
    }
    setLoading(false);
    // расстояние — только если разрешение уже дано (не спрашиваем при каждом открытии)
    if (task) {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({}).catch(() => null));
        if (pos) setDist(distanceM(pos.coords.latitude, pos.coords.longitude, task.lat, task.lng));
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const claim = () =>
    Alert.alert(
      "Принять задание?",
      `Оно закрепится за вами на 48 часов. Когда уберёте место, сфотографируйте результат прямо там — в радиусе ${RESULT_RADIUS_M} м.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Принять",
          onPress: async () => {
            setBusy("claim");
            const { error } = await supabase.rpc("claim_task", { p_id: Number(id) });
            setBusy(null);
            if (error) Alert.alert("Не получилось", error.message);
            await load();
          },
        },
      ]
    );

  const release = () =>
    Alert.alert("Отказаться от задания?", "Оно снова станет доступным другим участникам.", [
      { text: "Нет", style: "cancel" },
      {
        text: "Отказаться",
        style: "destructive",
        onPress: async () => {
          setBusy("release");
          const { error } = await supabase.rpc("release_task", { p_id: Number(id) });
          setBusy(null);
          if (error) Alert.alert("Не получилось", error.message);
          await load();
        },
      },
    ]);

  const sendResult = async () => {
    if (!t) return;
    // сначала место: фото делаем только там, где убирали
    const here = await getCurrentCoords();
    if (!here) return;
    const d = distanceM(here.lat, here.lng, t.lat, t.lng);
    setDist(d);
    if (d > RESULT_RADIUS_M) {
      Alert.alert("Вы далеко от места", `До точки ${formatDistance(d)}. Подойдите ближе — до ${RESULT_RADIUS_M} м — и сфотографируйте результат там.`, [
        { text: "Понятно", style: "cancel" },
        { text: "Маршрут", onPress: () => openRoute(t.lat, t.lng) },
      ]);
      return;
    }
    const photo = await takePhoto();
    if (!photo) return;
    setBusy("result");
    try {
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const path = await uploadPhoto("reports", photo, user.id, `result-${t.id}`);
      const { error } = await supabase.rpc("submit_task_result", { p_id: t.id, p_photo_path: path, p_lat: here.lat, p_lng: here.lng });
      if (error) throw error;
      Alert.alert("Результат отправлен", `Модератор сравнит фото «было» и «стало». После подтверждения вы получите +${t.points} TZ.`);
    } catch (e: any) {
      Alert.alert("Не удалось отправить", e?.message ?? "Проверьте интернет и попробуйте снова.");
    } finally {
      setBusy(null);
      await load();
    }
  };

  if (loading) {
    return (
      <Screen bottomInset>
        <BackButton />
        <SkeletonCard height={260} />
        <Skeleton width="70%" height={28} style={{ marginTop: space.x4 }} />
        <Skeleton width="40%" height={14} style={{ marginTop: space.x2 }} />
      </Screen>
    );
  }
  if (error || !t) {
    return (
      <Screen bottomInset>
        <BackButton />
        {error ? (
          <ErrorState onRetry={load} />
        ) : (
          <EmptyState icon="map-outline" title="Задание не найдено" text="Возможно, его уже сняли с карты." action="К карте" onAction={() => router.replace("/map")} />
        )}
      </Screen>
    );
  }

  const cat = reportCategory(t.category);
  const mineInProgress = t.is_mine && t.status === "in_progress";
  const photoW = width - space.gutter * 2;

  let footer: React.ReactNode = null;
  if (t.status === "available" && !t.is_my_report) {
    footer = (
      <View style={s.footerRow}>
        <Button label="Маршрут" icon="navigate-outline" variant="secondary" onPress={() => openRoute(t.lat, t.lng)} style={{ flex: 1 }} />
        <Button label="Принять задание" icon="hand-left-outline" onPress={claim} loading={busy === "claim"} style={{ flex: 1.4 }} />
      </View>
    );
  } else if (mineInProgress) {
    footer = (
      <View style={{ gap: space.x2 }}>
        <Button label="Сфотографировать результат" icon="camera-outline" onPress={sendResult} loading={busy === "result"} />
        <View style={s.footerRow}>
          <Button label="Маршрут" icon="navigate-outline" variant="secondary" onPress={() => openRoute(t.lat, t.lng)} style={{ flex: 1 }} />
          <Button label="Отказаться" variant="danger" onPress={release} loading={busy === "release"} style={{ flex: 1 }} />
        </View>
      </View>
    );
  } else if (t.status !== "completed") {
    footer = <Button label="Построить маршрут" icon="navigate-outline" variant="secondary" onPress={() => openRoute(t.lat, t.lng)} />;
  }

  return (
    <Screen bottomInset footer={footer}>
      <BackButton />

      {urls.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / photoW))}
            style={{ borderRadius: radius.card }}
          >
            {urls.map((u) => (
              <Image key={u} source={{ uri: u }} style={[s.photo, { width: photoW }]} />
            ))}
          </ScrollView>
          {urls.length > 1 && (
            <View style={s.counter}>
              <AppText style={s.counterText}>
                {page + 1} / {urls.length}
              </AppText>
            </View>
          )}
        </View>
      ) : (
        <View style={[s.photo, s.noPhoto]}>
          <Ionicons name={cat.icon} size={40} color={color.muted} />
        </View>
      )}

      <View style={s.statusRow}>
        <StatusPill status={t.status} />
        <AppText variant="caption">{cat.label}</AppText>
      </View>
      <AppText variant="h1" style={{ marginTop: space.x2 }}>
        {t.title}
      </AppText>

      <View style={s.facts}>
        <Fact icon="speedometer-outline" text={DIFFICULTY[t.difficulty]?.label ?? t.difficulty} />
        <Fact icon="leaf-outline" text={`+${t.points} TZ`} />
        {dist !== null && <Fact icon="navigate-outline" text={formatDistance(dist)} />}
      </View>

      {mineInProgress && (
        <Note icon="time-outline" text={`Задание за вами. Осталось ${timeLeft(t.claim_expires_at)} — потом оно снова станет доступным.`} />
      )}
      {mineInProgress && t.last_reject_reason ? (
        <Note icon="information-circle-outline" tone="danger" text={`Модератор вернул результат: ${t.last_reject_reason}. Переснимите фото.`} />
      ) : null}
      {t.is_mine && t.status === "under_review" && (
        <Note icon="hourglass-outline" tone="warn" text={`Результат на проверке. После подтверждения вы получите +${t.points} TZ.`} />
      )}
      {t.status === "in_progress" && !t.is_mine && <Note icon="walk-outline" text="Это место уже убирает другой участник." />}
      {t.status === "available" && t.is_my_report && <Note icon="person-outline" text="Это ваша заявка — убрать место должен другой участник." />}
      {t.status === "completed" && <Note icon="checkmark-done-outline" text="Место убрано. Спасибо всем, кто помог!" />}

      <SectionHeader title="Что нужно сделать" />
      <AppText variant="body" color={color.ink}>
        {t.description}
      </AppText>
      <AppText variant="caption" style={{ marginTop: space.x2 }}>
        Сообщил(а): {t.author_name} · {new Date(t.created_at).toLocaleDateString("ru-RU")}
      </AppText>

      <SectionHeader title="Где это" />
      <View style={s.map}>
        <OsmMap
          style={StyleSheet.absoluteFill}
          center={t}
          zoom={16}
          interactive={false}
          markers={[{ id: "point", lat: t.lat, lng: t.lng, kind: "point" }]}
          onPress={() => openRoute(t.lat, t.lng)}
        />
      </View>
      <View style={s.addr}>
        <Ionicons name="location-outline" size={16} color={color.muted} />
        <AppText variant="body" color={color.muted} style={{ flex: 1 }}>
          {t.address || t.place_name || `${t.lat.toFixed(5)}, ${t.lng.toFixed(5)}`}
        </AppText>
      </View>
      <View style={s.safety}>
        <Ionicons name="shield-checkmark-outline" size={16} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Убирайте в перчатках, не трогайте стекло, шприцы и химикаты — о таком сообщите взрослым. Не ходите к воде и на
          стройки одни.
        </AppText>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  photo: { height: 260, borderRadius: radius.card, backgroundColor: color.sand },
  noPhoto: { alignItems: "center", justifyContent: "center" },
  counter: {
    position: "absolute",
    right: space.x3,
    bottom: space.x3,
    backgroundColor: "rgba(21,61,44,0.8)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { fontFamily: font.semibold, fontSize: 12, color: color.onForest },
  statusRow: { flexDirection: "row", alignItems: "center", gap: space.x2, marginTop: space.x4 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: space.x2, marginTop: space.x3, marginBottom: space.x2 },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
  },
  factText: { fontFamily: font.semibold, fontSize: 13, color: color.ink },
  note: { flexDirection: "row", gap: space.x2, borderRadius: radius.field, padding: space.x3, marginTop: space.x2 },
  map: { height: 170, borderRadius: radius.card, overflow: "hidden", backgroundColor: color.sand },
  addr: { flexDirection: "row", gap: 6, marginTop: space.x2 },
  safety: { flexDirection: "row", gap: 6, marginTop: space.x4, backgroundColor: color.sand, borderRadius: radius.field, padding: space.x3 },
  footerRow: { flexDirection: "row", gap: space.x2 },
});
