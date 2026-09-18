/**
 * Espejo exacto del contrato del backend real (Fastify), tal como lo devuelve
 * la API. Estos tipos son el formato "de la red"; `types/content.ts` y
 * `types/exercise.ts` son el formato que consume el resto de la app y se
 * obtienen adaptando estos en `lib/content.ts` / `features/lesson/mapExercise.ts`.
 */

export interface ApiInstrument {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
  order: number;
}

export interface ApiUnit {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

export interface ApiLesson {
  id: string;
  title: string;
  order: number;
  xpReward: number;
}

/** Los 7 tipos que existen en `tipos_ejercicio`. Solo los dos primeros tienen `data` documentada hoy. */
export type ApiExerciseType =
  | 'opcion_multiple'
  | 'escuchar_y_elegir'
  | 'ritmo_toque'
  | 'deteccion_guitarra'
  | 'emparejar'
  | 'banco_palabras'
  | 'dictado';

export type ApiExerciseDifficulty = 'principiante' | 'intermedio' | 'avanzado';

export interface ApiMultipleChoiceData {
  opciones: string[];
  respuestaCorrectaIndice: number;
  dificultad: ApiExerciseDifficulty;
}

export interface ApiListenAndChooseData extends ApiMultipleChoiceData {
  urlAudio: string;
}

export interface ApiExercise {
  id: string;
  type: ApiExerciseType;
  typeName: string;
  prompt: string;
  /** Forma libre; solo está documentada para opcion_multiple/escuchar_y_elegir. */
  data: ApiMultipleChoiceData | ApiListenAndChooseData | Record<string, unknown>;
  order: number;
}

export interface ApiLessonWithExercises {
  lessonId: string;
  lessonTitle: string;
  exercises: ApiExercise[];
}

export interface ApiProgress {
  /** UUID desde la migración de usuarios.id; solo informativo, el cliente no lo usa. */
  userId: string;
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  maxLives: number;
  gems: number;
  lastPracticeDate: string | null;
  /** ISO de cuándo llega la próxima vida, o null si ya están al máximo. */
  livesRegenerateAt: string | null;
  updatedAt: string;
}

/** Respuesta de POST /progress/me/lessons/:lessonId/complete. */
export interface ApiCompleteLessonResponse {
  progress: ApiProgress;
  /** false si la lección ya se había completado antes (no se repite el XP, es idempotente). */
  xpAwarded: boolean;
}

export interface ApiInstrumentProgress {
  instrumentId: string;
  instrumentName: string;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Respuesta de GET /missions/me: sin envelope, un array plano con las
 * misiones diarias y el reto mensual mezclados (se distinguen por `isDaily`).
 * `currentValue`/`completed` los calcula el backend, pero hoy no existe
 * endpoint de escritura que los actualice: siempre llegan en 0/false.
 */
export interface ApiMission {
  id: string;
  slug: string;
  name: string;
  description: string;
  targetValue: number;
  xpReward: number;
  gemsReward: number;
  isDaily: boolean;
  currentValue: number;
  completed: boolean;
  completedAt: string | null;
}

/**
 * Respuesta de GET /leagues/me (requiere token). 404 si el usuario no está
 * en un grupo de la temporada activa (hoy no hay ninguna temporada_liga
 * activa en la base: el endpoint da 404 para todos, no es un error nuestro).
 */
export interface ApiLeagueMe {
  groupId: string;
  seasonId: string;
  seasonStartsAt: string;
  seasonEndsAt: string;
  levelName: string;
  levelOrder: number;
  levelIconUrl: string | null;
  ranking: ApiLeagueRankingEntry[];
}

export interface ApiLeagueRankingEntry {
  userId: string;
  weeklyXp: number;
  finalPosition: number | null;
  /** Nombre visible del perfil, o username si no tiene perfil. */
  displayName: string;
  avatarUrl: string | null;
}

/** Respuesta de GET /news (sin auth). `tag` es texto libre, no un catálogo fijo. */
export interface ApiNewsItem {
  id: string;
  slug: string;
  title: string;
  tag: string;
  body: string;
  publishedAt: string;
}

/** GET /clubs (sin auth): listado. */
export interface ApiClub {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  memberCount: number;
  createdAt: string;
}

/** GET /clubs/:clubId (sin auth, 404 si no existe): detalle con miembros. */
export interface ApiClubDetail extends ApiClub {
  members: ApiClubMember[];
}

export interface ApiClubMember {
  userId: string;
  roleSlug: string;
  roleName: string;
  joinedAt: string;
}

/** GET /achievements/me (requiere token). */
export interface ApiAchievement {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
}

/** Catálogo fijo de tipos_articulo_tienda. */
export type ApiShopItemType = 'congelar_racha' | 'recarga_vidas' | 'cosmetico' | 'suscripcion';

/** GET /shop/items (sin auth). */
export interface ApiShopItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  itemTypeSlug: ApiShopItemType;
  itemTypeName: string;
  /** Precio en gemas, o null si este artículo no se compra con gemas. */
  priceGems: number | null;
  /** Precio en centavos de dinero real (vía RevenueCat), o null. */
  priceMoneyCents: number | null;
  iconUrl: string | null;
}

/** GET /shop/me/inventory (requiere token). */
export interface ApiInventoryItem {
  itemId: string;
  itemSlug: string;
  itemName: string;
  quantity: number;
  updatedAt: string;
}

/** Respuesta de GET /progress/me/summary: todo lo que necesita la pantalla de progreso en un solo request. */
export interface ApiProgressSummary {
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  maxLives: number;
  livesRegenerateAt: string | null;
  gems: number;
  lastPracticeDate: string | null;
  updatedAt: string;
  totalLessonsCompleted: number;
  /** "YYYY-MM-DD"[], últimos 30 días con al menos 1 lección completada. */
  activeDates: string[];
  progressByInstrument: ApiInstrumentProgress[];
}
