import { supabase } from "./supabase";
import { locale, tr, trs } from "./i18n";

// Мессенджер: личные чаты и группы. Всё меняется только через RPC в Supabase (см. CLAUDE.md → «Мессенджер»),
// новые сообщения приходят через Realtime (таблица messages, RLS — только участники чата).

export type ChatListItem = {
  id: number;
  kind: "direct" | "group";
  title: string;
  other_id: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  last_body: string | null;
  last_is_mine: boolean | null;
  last_at: string;
  unread: number;
  members: number;
};

export type ChatMember = { id: string; name: string; emoji: string | null; color: string | null; role: "admin" | "member"; is_me: boolean };

export type ChatInfo = {
  id: number;
  kind: "direct" | "group";
  title: string;
  other_id: string | null;
  my_role: "admin" | "member";
  blocked_by_me: boolean;
  blocked_me: boolean;
  members: ChatMember[];
};

export type ChatMessage = {
  id: number;
  sender_id: string | null;
  sender_name: string;
  body: string | null;
  deleted: boolean;
  created_at: string;
  is_mine: boolean;
};

export type FoundUser = { id: string; name: string; avatar_emoji: string | null; avatar_color: string | null };

export const MAX_MESSAGE = 1000;

/** Время в списке чатов: сегодня — часы, на этой неделе — день, раньше — дата. */
export function chatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  const days = (now.getTime() - d.getTime()) / 86400000;
  if (days < 6) return d.toLocaleDateString(locale(), { weekday: "short" });
  return d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
}

export function messageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
}

/** Текст ошибки RPC для пользователя (сервер возвращает понятные русские сообщения). */
export function chatError(e: { message?: string } | null | undefined) {
  const m = e?.message ?? "";
  return /[а-яё]/i.test(m) ? trs(m) : tr("Проверьте интернет и попробуйте снова.");
}

/** Подписка на новые и изменённые сообщения во всех моих чатах (RLS отдаёт только свои). */
export function subscribeMessages(name: string, onChange: (row: { conversation_id: number }) => void) {
  const ch = supabase
    .channel(name)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (p) =>
      onChange((p.new && "conversation_id" in p.new ? p.new : p.old) as { conversation_id: number })
    )
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
