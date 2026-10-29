# CLAUDE.md — TazaNiyet

Этот файл — главный контекст для работы с проектом. Читай его перед любыми изменениями.
Общие правила Expo (команды, документация, EAS) — в [AGENTS.md](AGENTS.md); они тоже обязательны.

## 1. Назначение приложения

**TazaNiyet** — мобильное эко-приложение для школьников Казахстана (интерфейс на русском).

> **Платформа: только Android-телефоны.** iOS и веб не поддерживаются и не проверяются — не тратить на них
> время и не добавлять ради них код. Проверять на Android (Expo Go / development build / APK-профиль `preview`),
> учитывать системную панель навигации (жесты и кнопки), разные размеры экранов и клавиатуру Android.
> Настройки `ios` и `web` в `app.json` не трогать без запроса.
Пользователь выполняет экологические задания в своём городе/селе, подтверждает их фото «до» и «после»,
модератор проверяет заявку и начисляет очки **TZ**. Очки дают ранги, место в рейтинге и
подтверждённое портфолио (QR-код) для поступления в вузы.

Основные функции:

- **Регистрация / вход** по почте и паролю (Supabase Auth).
- **Онбординг безопасности** (`/safety`): год рождения; для детей ≤ 14 лет — имя и контакт родителя,
  согласие с политикой конфиденциальности. Пока согласие родителей не подтверждено модератором,
  отправлять задания нельзя.
- **Выбор места** (`/place`): область Казахстана + тип населённого пункта (city / town / village).
  От типа зависит, какие задания видны (`TYPES_FOR` в `src/app/(tabs)/index.tsx`).
- **Задания** (главная вкладка): задание дня, фильтр по категориям (clean, trees, recycle, water, edu, animals),
  эко-факт дня, общая статистика сообщества.
- **Выполнение задания** (`/task`): фото «до» и «после» с камеры → загрузка в Storage → заявка на проверку.
- **Питомец-маскот и дерево (баобаб)** (`PetCard`): растёт вместе с рангом, грустит, если давно не было активности;
  серия дней подряд (streak).
- **Ранги**: Росток → Побег → Дерево → Страж природы → Хранитель степи (`src/lib/ranks.ts`).
- **Праздник** (`Celebration`) при росте очков и повышении ранга (сравнение с последним значением в AsyncStorage).
- **Рейтинг** с пьедесталом топ-3.
- **Вузы**: каталог университетов с фильтрами по городу, типу и поиском.
- **Портфолио**: создание/отзыв публичного кода с QR и проверка чужого портфолио по коду.
- **Профиль**: аватар (эмодзи + цвет), никнейм, «Мои задания и статусы», настройки, удаление аккаунта.
- **Модерация** (`/moderator`, только `is_moderator = true`): одобрить / отклонить с причиной /
  пометить как обман со штрафом; подтверждение согласия родителей по почте ребёнка.

## 2. Технологии

- **Expo SDK 58**, React Native 0.88, React 19.3, TypeScript 6 (strict).
- **Expo Router** (файловая маршрутизация, typed routes), включён React Compiler (`app.json → experiments`).
- **Supabase** (`@supabase/supabase-js`): Auth, Postgres, Storage, RPC. Сессия хранится в AsyncStorage.
- `react-native-reanimated` (анимации), `react-native-svg` (маскот/дерево), `react-native-qrcode-svg`,
  `expo-image-picker` (камера), `expo-haptics`, `@expo/vector-icons` (Ionicons во вкладках).
- Сборка — **EAS** (`eas.json`: development / preview (APK) / production). Android package `com.sunsetq.TazaNiyet2`.
- Нативные папки `ios/` и `android/` не хранятся в репозитории (CNG) — не создавать и не править их вручную.

### Переменные окружения

Файл `.env` (в `.gitignore`, в репозиторий не коммитить):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...   # anon/publishable key, НЕ service_role
```

## 3. Структура проекта

```
src/
  app/                    # ТОЛЬКО экраны (каждый файл = маршрут)
    _layout.tsx           # корневой Stack, заголовки скрыты
    (tabs)/_layout.tsx    # нижние вкладки: Задания, Вузы, Рейтинг, Портфолио, Профиль
    (tabs)/index.tsx      # главная: задания, питомец, статистика, проверка онбординга
    (tabs)/universities.tsx, leaderboard.tsx, portfolio.tsx, profile.tsx
    login.tsx, safety.tsx, place.tsx, privacy.tsx
    task.tsx, my.tsx, edit-profile.tsx, settings.tsx, moderator.tsx
    university/[id].tsx   # подробности о вузе (по id из таблицы universities)
    tasks.txt             # пустой файл (назначение неизвестно — не удалять без согласования)
  components/             # переиспользуемые компоненты
    anim.tsx              # PressScale, PulseEmoji, CountUp
    avatar.tsx            # Avatar + AVATAR_EMOJIS / AVATAR_COLORS
    pet-card.tsx          # hero-карточка главной: ранг, очки, баобаб + Барс, прогресс, статистика
    mascot.tsx, living-tree.tsx (+ grow-tree.tsx), celebration.tsx (+ confetti.tsx)
    ui/                   # базовые компоненты дизайн-системы:
                          #   screen, app-text, button, card, chip, list-row (ListRow, RowIcon),
                          #   section-header, text-field, back-button, empty-state (EmptyState / ErrorState),
                          #   skeleton (Skeleton, SkeletonCard), status-pill
  lib/
    supabase.ts           # единственный клиент Supabase
    theme.ts              # дизайн-токены: color, categoryTint, space, radius, font, type
    universities.ts       # тип Uni и разбор направлений
    ranks.ts              # ранги и пороги очков
    haptics.ts            # обёртки над expo-haptics
assets/                   # иконки, сплэш
```

Файлы стартового шаблона create-expo-app (themed-*, app-tabs*, animated-icon*, hooks/, constants/,
global.css, scripts/reset-project.js и их картинки) удалены 30.10.2026 с согласия владельца — не восстанавливать.
Удалять другие файлы — только по согласованию с владельцем.
(`confetti.tsx`, `grow-tree.tsx`, `mascot.tsx`, `lib/haptics.ts` используются — через относительные импорты `./`.)

## 4. Архитектура и данные

- Нет глобального стейта (без Redux/Context). Каждый экран сам грузит данные через `supabase` в
  `useFocusEffect` / `useEffect` и хранит их в `useState`.
- Проверка авторизации делается в экранах: `supabase.auth.getSession()` → нет сессии → `router.replace("/login")`.
- **Поток онбординга** (в `(tabs)/index.tsx`): нет сессии → `/login`; нет `birth_year` → `/safety`;
  нет `region`/`place_type` → `/place`; иначе главная.
- Параметры задания передаются в `/task` через query-параметры (`id, title, points, emoji, description`).
- Фото загружаются в bucket `submissions` по пути `<user_id>/<timestamp>-before|after.jpg`;
  модератор смотрит их через signed URL.
- Очки начисляет **только сервер** (RPC модератора). Клиент никогда не пишет `points` напрямую.

### Backend (Supabase) — схема не хранится в репозитории

Таблицы: `profiles` (name, nickname, avatar_emoji, avatar_color, points, region, place_name, place_type,
birth_year, parent_verified, is_moderator), `tasks` (emoji, title, description, place_type, points, category),
`submissions` (user_id, task_id, before_path, after_path, status: pending/approved/rejected, reject_reason, created_at;
уникальность активной заявки → ошибка `23505`), `universities` (name, city, type, website, description, programs
— через запятую, requirements — как поступить, photo_url, photo_credit, checked_at), `portfolio_links` (user_id, code).
Триггеры на `submissions`: лимит 5 заявок в сутки, повтор задания не раньше чем через 7 дней, проверка безопасности/согласия.
Права: пользователь сам может менять в `profiles` только `region`, `place_type`, `place_name` (column-level grants).

**Фото вузов** — только в публичном бакете Storage `uni-photos` проекта. Wikimedia отдаёт 403 запросам из Android-приложения,
поэтому ссылки на upload.wikimedia.org в `photo_url` не ставить. Для фото CC BY / CC BY-SA обязательно заполнять `photo_credit`.
Данные вузов — только проверенные (источник + `checked_at`).

RPC: `get_community_stats`, `get_leaderboard`, `get_portfolio(p_code)`, `save_safety_info`, `update_appearance`,
`review_submission`, `penalize_submission`, `confirm_parent_consent`, `delete_my_account`.

Безопасность держится на RLS и RPC в Supabase. При изменении запросов не ломать имена таблиц, колонок,
RPC и их параметров — это сломает приложение у всех пользователей. Изменения схемы БД — только с явного согласия.

## 5. Дизайн

### Дизайн-система «Тихий лес»

Редизайн всех экранов (этапы 0–6) выполнен 30.10.2026 в ветке GitHub `redesign` (SunsetqDev/TazaNiyet; локально — `redesign-github` в «ДокументыTazaNiyet»). В `main` переходим только после
проверки владельцем на Android-телефоне. Веб-версия не запускается и не нужна: при серверном рендере
`web.output: "server"` AsyncStorage Supabase падает с `window is not defined`.
Проверка сборки без телефона: `npx expo export --platform android --no-bytecode --output-dir dist` (потом удалить `dist`).

- **Токены** — `src/lib/theme.ts`: `color`, `categoryTint`, `space`, `radius`, `font`, `type`. Цвета и размеры
  в экранах — только через них (исключение — собственные цвета рисунков Барса и баобаба).
- **Палитра**: forest `#153D2C` (hero-карточка, основная кнопка), moss `#1F4E39`, lime `#C9F36A`
  (только заливка или текст на forest — **никогда не текст на светлом фоне**, нечитаемо), cream `#F6F4EC` (фон),
  surface `#FFFFFF`, sand `#E9E5D6`, ink `#252A27`, muted `#6E746E`, line `#E3E0D3`; статусы warn / danger.
- **Шрифты**: Literata (заголовки) + Inter (интерфейс) — проверено, что есть все казахские буквы
  (Manrope и Fraunces НЕ подходят). Загрузка — `useFonts` в `src/app/_layout.tsx`, импорт **по одному начертанию**
  (`@expo-google-fonts/inter/400Regular`), иначе в сборку попадают все ~34 файла. Не использовать `fontWeight` —
  нужное начертание через `font.*` / `type.*`.
- **Компоненты** `src/components/ui/*`: экран всегда в `Screen` (безопасные области, клавиатура; `bottomInset` —
  для Stack-экранов без таб-бара; `footer` — закреплённая кнопка), текст — `AppText variant`, поля — `TextField`,
  «назад» — `BackButton`, загрузка — `Skeleton`, пусто/ошибка — `EmptyState` / `ErrorState` (сырой текст ошибки
  загрузки не показывать). Иконки — Ionicons; эмодзи — только из данных (эмодзи задания, аватар, значки, ранги).
  Карточки без теней, одна hero-карточка на экран. `RefreshControl` — с `colors={[color.forest]}` (Android).
- **Анимации**: появление только при первом показе (≤ 5 шагов, 250–350 мс); `Skeleton` учитывает `useReducedMotion`.

### Решения владельца после редизайна (30.10.2026)

1. **Вузы** хранятся в Supabase, таблица `universities` (фото, краткая информация). Разрешено работать с Supabase,
   но **добавлять только проверенную и реальную информацию** — ничего не выдумывать (ни данных вузов, ни программ).
   Избранные вузы — разрешено хранить в Supabase (нужна новая таблица с RLS).
2. **Периоды рейтинга и профиль участника** — разрешены (нужны изменения RPC `get_leaderboard` на сервере).
3. **Мероприятия, «Жасыл Ел»** — решение позже, не делать. **Сертификаты** — в будущем PDF со статистикой
   человека: выполненные задания, часы волонтёрской работы; пойдут в портфолио. Сейчас не делать
   (поля «часы» в базе пока нет).
4. Серия дней — разное определение на главной и в профиле, владелец в курсе; не менять без запроса.
5. **Место пользователя** (`region`, `place_type`, `place_name`) станет основой привязки заданий к городам:
   задания по городам, карта, фото проблемных мест от жителей → из них составляются задания. Экран
   «Где вы живёте?» теперь подставляет сохранённые значения. Данные места не ломать и не смешивать.


## 6. Требования владельца к изменениям

1. **Сначала изучать существующий код**, затем менять. Следовать стилю окружающего кода
   (inline `StyleSheet.create` внизу файла, короткие имена стилей `s`/`styles`, русские тексты UI и комментарии).
2. **Не переписывать приложение ради небольшого изменения.** Минимальные точечные правки.
3. **Большая задача → сначала план и ожидание подтверждения**, потом реализация.
4. **После изменений запускать проверки** и исправлять ошибки:
   ```bash
   npx tsc --noEmit
   npx expo lint
   ```
   (при проблемах с зависимостями — `npx expo-doctor`).

   **Состояние проверок (30.10.2026):**
   - `tsc` проходит без ошибок — держать так. Для типов CSS и typed routes нужен файл `expo-env.d.ts`
     (в `.gitignore`, создаётся автоматически при `npx expo start`; если его нет — создать с
     `/// <reference types="expo/types" />`).
   - `expo lint` (ESLint 9 + `eslint-config-expo`, конфиг `eslint.config.js`) падает с
     «Cannot find native binding» у `unrs-resolver`: npm заблокировал его postinstall-скрипт.
     Лечится `npm install-scripts approve unrs-resolver` + переустановкой — только с согласия владельца.
5. **Git**: сохранять рабочие версии коммитами с понятным сообщением на русском; перед рискованными
   изменениями — коммит текущего рабочего состояния.
6. **Не удалять важные файлы без необходимости**; удаление неиспользуемого кода — только с согласия.
7. Новые пакеты ставить через `npx expo install <пакет>` (подбирает версии под SDK 58).
   Перед использованием API Expo сверяться с документацией v58 (см. AGENTS.md).

## 7. Ограничения — чтобы ничего не сломать

- Не менять поток онбординга (login → safety → place → главная) и проверку согласия родителей для ≤ 14 лет.
- Не начислять/изменять очки на клиенте; не обходить модерацию.
- Не менять пути и имена bucket `submissions`, таблиц, колонок, RPC без синхронного изменения бэкенда.
- Не коммитить `.env`, ключи, `service_role`.
- Не трогать `ios/`, `android/`; нативные настройки — через `app.json` и config-плагины.
- Не менять `android.package`, `slug`, `scheme`, `extra.eas.projectId` в `app.json` — это сломает сборки и обновления.
- Экраны должны работать на маленьких телефонах (портретная ориентация) — проверять переполнение текста.
- Данные детей (год рождения, контакты родителей) не показывать другим пользователям и не логировать.
