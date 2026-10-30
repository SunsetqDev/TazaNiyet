import { Redirect } from "expo-router";

// Центральная кнопка «➕» в таб-баре открывает /report сама (см. tabBarButton в _layout.tsx).
// Этот экран нужен только как место для кнопки; если сюда всё же попали — уходим на форму заявки.
export default function NewReportTab() {
  return <Redirect href="/report" />;
}
