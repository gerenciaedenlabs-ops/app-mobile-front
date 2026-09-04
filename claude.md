# EdenShip Frontend: Arquitectura React Native / iOS

## Propósito

Este archivo guía el desarrollo del cliente móvil de Shipathon 2026. El proyecto comienza con una base React Native + TypeScript estricto para iOS; las integraciones de audio, monetización y backend se incorporarán en módulos posteriores cuando el plan lo indique.

## 1. Principios de arquitectura

### Vertical slices

Toda pantalla o funcionalidad pertenece a un módulo autónomo dentro de `src/modules/`. No se crean carpetas globales de negocio como `/screens`, `/hooks`, `/commands` o `/adapters`. El código agnóstico y reutilizable vive en `src/shared/`.

Una nueva funcionalidad DEBE comenzar en `src/modules/<nombre-del-modulo>/`. Un módulo no importa archivos internos de otro módulo; la comunicación entre módulos usa contratos públicos o servicios compartidos.

### TypeScript estricto

Todo el código de producto se escribe en TypeScript con `strict: true`, `noUncheckedIndexedAccess` y `noImplicitOverride`. Se evita `any`; los datos externos se validan y se convierten a tipos del dominio en infraestructura.

### CQRS frontend

- **Commands**: funciones o handlers que ejecutan mutaciones, navegación con efectos, persistencia, llamadas a SDKs o solicitudes al backend.
- **Queries**: hooks `use<Nombre>Query` que leen estado reactivo local o caché remoto. No mutan estado ni ejecutan efectos secundarios.
- **Presentación**: compone la vista, consume Queries y dispara Commands en eventos explícitos.

## 2. Las cuatro capas por módulo

Cada módulo debe tener estas capas, aunque inicialmente alguna contenga solo un contrato mínimo:

1. **`presentation/`**: pantallas `.tsx` y componentes gráficos React Native. Es declarativa y no conoce SDKs ni detalles de transporte.
2. **`application/`**: orquestación CQRS. `commands/` contiene acciones y `queries/` contiene custom hooks de lectura.
3. **`domain/`**: entidades, interfaces, tipos, validaciones y reglas de negocio en TypeScript puro. No importa React, React Native ni librerías externas.
4. **`infrastructure/`**: adaptadores de APIs externas, persistencia, cliente HTTP y SDKs nativos. Traduce dependencias externas hacia contratos del dominio.

## 3. Blueprint universal

```text
src/modules/<nombre-del-modulo>/
├── presentation/
│   ├── <Nombre>Screen.tsx
│   └── components/
│       └── <SubComponente>Component.tsx
├── application/
│   ├── commands/
│   │   └── <Accion>Command.ts
│   └── queries/
│       └── use<Consulta>Query.ts
├── domain/
│   └── <EntidadOrTipo>.ts
└── infrastructure/
    └── <Nombre>Adapter.ts
```

`src/shared/` se reserva para UI kit base, configuración, providers globales, clientes HTTP y helpers de formato sin reglas de negocio.

## 4. Estado y reactividad

- **Zustand**: estado efímero de interfaz, preferencias locales y stores de módulos con suscripciones selectivas.
- **TanStack Query**: caché, fetching, invalidación y estados del servidor.
- Una Query solo lee. Un Command puede actualizar un store o invalidar una query.
- No duplicar una misma fuente de verdad entre Zustand, TanStack Query y estado local de React.
- Usar `useState` para estado estrictamente local de baja frecuencia; no convertir cada evento de alta frecuencia en un render global.
- Limpiar listeners, timers y suscripciones en `useEffect` cuando se introduzcan integraciones asíncronas.

## 5. Fronteras futuras

Las integraciones que lleguen después deben conservar estas fronteras:

- Audio y JSI: adapter de `infrastructure/`; ningún binding nativo en presentación, aplicación o dominio.
- RevenueCat y paywalls: adapter/command de infraestructura; la UI solo expresa intención y consume estado de entitlement.
- Backend: cliente HTTP en infraestructura, DTOs traducidos a tipos de dominio y queries para la caché.

Estas integraciones NO forman parte de la base actual. No instalar ni importar sus SDKs hasta que exista una tarea explícita para ellas.

## 6. Nomenclatura y calidad

Los archivos deben llevar sufijos explícitos: `Screen.tsx`, `Component.tsx`, `Command.ts`, `use<Nombre>Query.ts` y `Adapter.ts`. Los nombres describen intención de negocio, no tecnología.

Antes de abrir una PR:

- ejecutar `npm run typecheck`;
- verificar que los imports respetan las capas;
- comprobar estados de carga, vacío y error en toda nueva pantalla;
- mantener accesibilidad, layout adaptable y cleanup de efectos;
- añadir pruebas de dominio para reglas deterministas.

## 7. Arranque del proyecto

Esta base usa Expo para obtener un arranque React Native iOS sencillo:

```bash
npm install
npm run start
```

Para ejecutar el simulador iOS:

```bash
npm run ios
```

La integración nativa real requerirá development build y Xcode cuando una tarea futura la solicite. Expo Go es suficiente para trabajar en la pantalla base mientras no existan módulos nativos adicionales.

## 8. Estructura inicial entregada

```text
App.tsx
src/modules/home/
├── presentation/
│   ├── HomeScreen.tsx
│   └── components/WelcomeComponent.tsx
├── application/
│   ├── commands/InitializeHomeCommand.ts
│   └── queries/useHomeQuery.ts
├── domain/HomeStatus.ts
└── infrastructure/HomeAdapter.ts
```

La pantalla `home` es deliberadamente pequeña: sirve para comprobar navegación futura, estilos base, separación por capas y el ciclo de typecheck sin adelantar integraciones del roadmap.
