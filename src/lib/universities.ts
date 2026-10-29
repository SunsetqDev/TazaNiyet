/** Строка таблицы universities. */
export type Uni = {
  id: number;
  name: string;
  city: string;
  type: string;
  website: string | null;
  description: string | null;
  programs: string | null;
  photo_url: string | null;
  checked_at: string | null;
  /** как поступить: ЕНТ / собственные экзамены, с годом актуальности */
  requirements: string | null;
  /** автор и лицензия фото — показывать под фото (требование CC BY / CC BY-SA) */
  photo_credit: string | null;
};

export const uniTypeLabel = (type: string) => (type === "college" ? "Колледж" : "Университет");

/** programs хранится строкой через запятую. */
export const uniPrograms = (u: Uni) =>
  (u.programs ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
