# EdenShip — app móvil para aprender música

App estilo Duolingo para aprender **guitarra, piano, batería y voz**: árbol de lecciones por
instrumento, XP, racha diaria y sistema de vidas.

Base construida con **Expo SDK 57 + TypeScript estricto + Expo Router + NativeWind + Zustand**.
Sin backend: todo el contenido vive en JSON local.

## Arrancar

```bash
npm install
npm start          # servidor de Expo; luego 'i' para iOS, 'a' para Android
npm run ios        # abre directamente el simulador de iOS
npm run typecheck  # tsc --noEmit
```

Funciona en **Expo Go** tal cual. La detección de guitarra por micrófono está simulada, así que
todavía no hace falta un dev build; sí lo hará cuando se conecte el audio real.

## Estructura

```text
app/                     Rutas (file-based routing de Expo Router)
├── _layout.tsx          Stack raíz, providers, hidratación del store, modo de audio
├── index.tsx            Selector de instrumento
├── learn/[instrumentId] Árbol de lecciones
├── lesson/[lessonId]    Runner de ejercicios
├── lesson/result.tsx    Resultado de la lección
├── profile.tsx          Racha, XP y calendario (modal)
└── paywall.tsx          Paywall, solo UI (modal)

components/   UI genérica sin reglas de negocio (Button, Screen, ProgressBar, HeartsBar…)
features/     UI con conocimiento del dominio, agrupada por funcionalidad
├── instruments/  Tarjeta de instrumento
├── skill-tree/   Nodos y unidades del árbol
├── lesson/       Runner, renderer y los 4 componentes de ejercicio
├── profile/      Calendario de racha y tiles de estadística
└── paywall/      Tarjetas de plan
hooks/        useGuitarPitchDetector (mock), useMetronome, useMetronomeClicks, useHearts
lib/          Lógica pura y testeable: unlock, streak, hearts, scoring, pitch, datetime, audio
content/      Currículo en JSON + validación + selectores tipados
store/        Zustand: progressStore (persistido) y sessionStore (efímero)
types/        Modelo de datos: content, exercise, progress
assets/audio/ Clips WAV generados (marcadores de posición)
scripts/      Generador de los WAV de ejemplo
```

**Regla de dependencias**: `app/` → `features/` → `components/` + `hooks/` + `lib/` + `store/`.
`lib/` y `types/` no importan React ni React Native; por eso su lógica se puede probar sin montar
componentes.

## Modelo de contenido

`Instrument` → `Unit` → `Lesson` → `Exercise`, con cuatro tipos de ejercicio discriminados por
`type`: `multiple_choice`, `listen_and_choose`, `rhythm_tap` y `guitar_detection`.

Detalle importante: **el estado de bloqueo de una lección no se guarda en ningún sitio**. Se deriva
del progreso en [lib/unlock.ts](lib/unlock.ts) cada vez que se pinta el árbol. El contenido es
inmutable y el progreso es la única fuente de verdad mutable.

Para añadir una lección:

1. crea `content/lessons/<id>.json`;
2. regístrala en `LESSON_SOURCES` dentro de [content/index.ts](content/index.ts) — Metro no hace
   globbing de archivos;
3. añade su `id` al array `lessonIds` de la unidad en `content/units.json`.

Al arrancar se validan tipos y coherencia entre archivos (que la lección exista, que su `unitId`
concuerde y que su `order` coincida con la posición en la unidad). Si algo falla, la app lanza un
error explícito con la ruta del campo en vez de romperse a medio pintar.

## Reglas de juego

- **Desbloqueo**: una lección se abre si es la primera de su unidad o si la anterior está completa;
  una unidad se abre cuando la anterior está terminada del todo.
- **Racha**: se actualiza al completar una lección. Mismo día no suma, día siguiente suma 1, un
  hueco de dos o más días la reinicia. Lo que se muestra es la *racha efectiva*, que ya cuenta como
  rota la que lleva más de un día parada — sin necesidad de ningún proceso en segundo plano.
- **Vidas**: 5 como máximo, una menos por fallo, una nueva cada 30 minutos. La regeneración se
  calcula de forma perezosa a partir de `lastRegenAt`, así que también corre con la app cerrada.
- **XP**: 60 % por terminar la lección y 40 % según la puntuación, más 5 de bonus si no hubo fallos.

## Audio

Los clips de `assets/audio/` son **tonos sintéticos generados**, no grabaciones:

```bash
node scripts/generate-placeholder-audio.mjs
```

Sirven para probar el flujo de `listen_and_choose` y para el clic del metrónomo. Sustitúyelos por
grabaciones reales manteniendo los mismos nombres de archivo, o registra nuevas claves en
[lib/audio.ts](lib/audio.ts).

## Qué queda pendiente

| Área | Estado | Dónde |
| --- | --- | --- |
| **Detección de guitarra** | Mock: simula una lectura que converge al objetivo | [hooks/useGuitarPitchDetector.ts](hooks/useGuitarPitchDetector.ts) |
| **RevenueCat** | Sin SDK. Planes y precios escritos a mano; "Suscribirse" simula la compra | [app/paywall.tsx](app/paywall.tsx), `setPremium` en [store/progressStore.ts](store/progressStore.ts) |
| **OneSignal** | Sin SDK. Punto de inicialización marcado | [app/\_layout.tsx](app/_layout.tsx) |
| **Backend** | Sin API. El currículo se carga de JSON local | [content/index.ts](content/index.ts) |
| **Audio real** | WAV sintéticos | [scripts/generate-placeholder-audio.mjs](scripts/generate-placeholder-audio.mjs) |
| **Tests** | Sin runner configurado | `lib/` está escrito como funciones puras para poder probarlo |

### Sobre `useGuitarPitchDetector`

Es el punto de integración más delicado, así que el contrato ya está fijado. La implementación real
debe mantener la firma exacta de `GuitarPitchDetector` y ocuparse de:

1. pedir permiso de micrófono (`requestRecordingPermissionsAsync()` de expo-audio);
2. abrir el stream de audio;
3. estimar la frecuencia (YIN o autocorrelación) para objetivos `kind: 'note'`, y un análisis de
   croma o detector polifónico para `kind: 'chord'`;
4. liberar el stream al desmontar.

`lib/pitch.ts` ya trae las conversiones Hz ↔ nota ↔ cents que necesitará. Cuando se conecte audio
nativo real, deja de bastar Expo Go: hará falta un development build.
