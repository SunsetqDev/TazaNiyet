import { Icon, IconBlob } from "../components/icon";
import { TaskArt } from "../components/task-art";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { takePhoto, uploadPhoto, type Photo } from "../lib/photos";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";
import { tr, trs } from "../lib/i18n";

function PhotoSlot({ label, photo, onPress, disabled }: { label: string; photo: Photo | null; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [s.slot, !photo && s.slotEmpty, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={disabled}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={s.photo} />
          <View style={s.slotTag}>
            <Icon name="checkmark" size={14} color={color.forest} />
            <AppText style={s.slotTagText}>{label}</AppText>
          </View>
          {!disabled && (
            <View style={s.retake}>
              <Icon name="camera-reverse-outline" size={16} color={color.onForest} />
            </View>
          )}
        </>
      ) : (
        <>
          <View style={{ marginBottom: 4 }}>
            <IconBlob size={48}>
              <Icon name="camera-outline" size={26} color={color.forest} />
            </IconBlob>
          </View>
          <AppText variant="bodyStrong">{tr("Фото")}{" "}{label.toLowerCase()}</AppText>
          <AppText variant="caption">{tr("нажмите, чтобы снять")}</AppText>
        </>
      )}
    </Pressable>
  );
}

export default function TaskScreen() {
  const { id, title, points, emoji, category, description } = useLocalSearchParams<{
    id: string;
    title: string;
    points: string;
    emoji: string;
    category?: string;
    description: string;
  }>();
  const router = useRouter();
  const [before, setBefore] = useState<Photo | null>(null);
  const [after, setAfter] = useState<Photo | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const snap = async (setter: (p: Photo) => void) => {
    const p = await takePhoto();
    if (p) setter(p);
  };

  const submit = async () => {
    if (!before || !after) {
      Alert.alert(tr("Нужны оба фото"), tr("Сделайте фото «до» и «после»."));
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
      const beforePath = await uploadPhoto("submissions", before, user.id, "before");
      const afterPath = await uploadPhoto("submissions", after, user.id, "after");
      const { error } = await supabase.from("submissions").insert({
        task_id: Number(id),
        before_path: beforePath,
        after_path: afterPath,
      });
      if (error) {
        if (error.code === "23505") {
          Alert.alert(tr("Уже отправлено"), tr("Это задание уже на проверке. Дождитесь результата."));
          return;
        }
        throw error;
      }
      setSent(true);
    } catch (e: any) {
      Alert.alert(tr("Не удалось отправить"), trs(e?.message) ?? tr("Проверьте интернет и попробуйте снова."));
    } finally {
      setSending(false);
    }
  };

  const ready = before && after;

  return (
    <Screen
      bottomInset
      footer={
        sent ? undefined : (
          <View style={{ gap: space.x2 }}>
            {!ready && (
              <AppText variant="caption" style={{ textAlign: "center" }}>
                {before ? tr("Осталось фото после") : tr("Сначала сфотографируйте место до")}
              </AppText>
            )}
            <Button label={tr("Отправить на проверку")} icon="paper-plane-outline" onPress={submit} loading={sending} />
          </View>
        )
      }
    >
      <BackButton />

      <View style={s.head}>
        <IconBlob size={72}>
          <TaskArt category={category} emoji={emoji} size={48} />
        </IconBlob>
        <View style={s.ptsPill}>
          <AppText style={s.ptsText}>+{points} TZ</AppText>
        </View>
      </View>
      <AppText variant="h1" style={{ marginTop: space.x4 }}>
        {title}
      </AppText>

      <SectionHeader title={tr("Как выполнить")} />
      <AppText variant="body" color={color.ink}>
        {description}
      </AppText>

      <SectionHeader title={tr("Фото")} hint={tr("до и после")} />
      <View style={s.row}>
        <PhotoSlot label={tr("До")} photo={before} onPress={() => snap(setBefore)} disabled={sent} />
        <PhotoSlot label={tr("После")} photo={after} onPress={() => snap(setAfter)} disabled={sent} />
      </View>
      <View style={s.note}>
        <Icon name="lock-closed-outline" size={14} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>{tr("Фото видят только проверяющие. В портфолио они не показываются.")}</AppText>
      </View>

      {sent && (
        <Animated.View entering={FadeInDown.duration(320)} style={s.success}>
          <View style={s.successIcon}>
            <Icon name="checkmark" size={28} color={color.forest} />
          </View>
          <AppText variant="h2" style={{ textAlign: "center" }}>{tr("Отправлено на проверку")}</AppText>
          <AppText variant="body" color={color.muted} style={{ textAlign: "center" }}>{tr("Очки TZ появятся после проверки. Статус — в профиле, в «Моих заданиях».")}</AppText>
          <Button label={tr("К заданиям")} variant="secondary" onPress={() => router.replace("/")} style={{ marginTop: space.x2, alignSelf: "stretch" }} />
        </Animated.View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ptsPill: { backgroundColor: color.forest, borderRadius: radius.pill, paddingHorizontal: space.x4, paddingVertical: space.x2 },
  ptsText: { fontFamily: font.bold, fontSize: 15, color: color.lime },
  row: { flexDirection: "row", gap: space.x3 },
  slot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  slotEmpty: { borderWidth: 1.5, borderColor: color.line, borderStyle: "dashed" },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  slotTag: {
    position: "absolute",
    left: space.x2,
    top: space.x2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: color.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotTagText: { fontFamily: font.semibold, fontSize: 12, color: color.forest },
  retake: {
    position: "absolute",
    right: space.x2,
    bottom: space.x2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(21,61,44,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.x3 },
  success: {
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x5,
    marginTop: space.x6,
  },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.lime, alignItems: "center", justifyContent: "center", marginBottom: space.x1 },
});
