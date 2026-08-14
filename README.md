# biblioteca-frontend

Frontend de **Biblioteca**, una aplicación personal de gestión de biblioteca. Angular 22 (standalone, signals, Signal Forms) que consume la API REST del backend Java y el microservicio de IA (`agentes-ia`), ambos a través del Gateway.

Este servicio es parte de una arquitectura de 4 componentes (frontend, backend, agentes-ia, gateway), coordinados desde un meta-repositorio que apunta a los 4 repos individuales. El frontend nunca llama directo a backend ni a agentes-ia: todas las peticiones pasan por el **gateway**, cuya URL vive en `environment.gatewayUrl`.

## Stack técnico

- **Angular 22** — standalone components (sin `NgModule`), signals, `computed()`, `effect()`
- **Angular Signal Forms** (`@angular/forms/signals`) — formularios basados en signals, no Reactive Forms clásico
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — con `@theme` para design tokens propios
- **ApexCharts** + **ng-apexcharts** — gráficos del dashboard de estadísticas
- **Firebase Auth** (`firebase` SDK web) — autenticación de usuario
- **RxJS** — HttpClient reactivo, interceptores
- **Vitest** — test runner (reemplaza a Karma/Jasmine en este proyecto)
- **TypeScript** ~6.0

## Arquitectura interna

Estructura por dominio (`features/`) + código transversal (`core/`, `shared/`):

```
src/app/
  app.ts / app.routes.ts / app.config.ts   Bootstrap, rutas, providers globales

  core/
    firebase.config.ts       Inicialización del SDK de Firebase
    guards/auth-guard.ts     Protege rutas autenticadas
    interceptors/            Adjunta el ID token de Firebase a cada request
    services/auth.ts         Login/logout, estado de sesión (signal)
    models/                  Interfaces TS de los DTOs (uno por entidad/flujo)

  features/
    auth/login/               Página de login
    home/                     Landing autenticada
    libros/                   CRUD de libros + flujo de importación externa
    autores/                  CRUD de autores + países + biografías
    estadisticas/             Dashboard con 4 tabs + recomendaciones

  shared/
    components/               Componentes reutilizables entre features
      campos-libro/ campos-autor/   Bloques de formulario compartidos (content projection)
      carrusel-libros/               Carrusel paginado genérico
      portada-libro/                 Imagen de portada con tamaños/fallback
    graficos/                 Wrappers de ApexCharts (barras, líneas, pie, treemap)
```

Patrón consistente: cada feature trae sus propios `*.service.ts` (uno por recurso del backend que consume) junto a sus componentes de página. No hay una carpeta `services/` global — los services viven junto al feature que los usa, salvo los transversales (`auth`) que sí están en `core/`.

## Autenticación

- **Firebase Auth** (email/contraseña) gestiona la sesión de usuario. `firebase.config.ts` inicializa la app de Firebase con las credenciales de `environment.firebaseConfig`.
- `Auth` (`core/services/auth.ts`) expone el estado de sesión como signal (`isLoggedInSignal`) y resuelve un `Promise` (`waitForAuthReady`) que se resuelve la primera vez que Firebase confirma el estado de auth — necesario porque Firebase valida la sesión de forma asíncrona al cargar la app.
- `authGuard` (`core/guards/auth-guard.ts`) espera `waitForAuthReady()` antes de decidir si permite la navegación; si no hay sesión, redirige a `/login`. Todas las rutas salvo `/login` lo usan (`canActivate: [authGuard]`).
- `authInterceptor` (`core/interceptors/auth-interceptor.ts`) adjunta el ID token de Firebase (`Authorization: Bearer <token>`) a **toda** petición HTTP saliente, sin excepción por ruta — es el Gateway quien decide qué exige y qué no.

Importante: este token de Firebase es distinto del JWT interno que circula entre Gateway → backend Java → agentes-ia. El frontend solo conoce y maneja el token de Firebase; nunca ve ni genera el JWT interno.

## Rutas

| Ruta | Componente | Notas |
|---|---|---|
| `/login` | `Login` | Única ruta sin guard |
| `/` | `Home` | Landing con carruseles (recomendaciones, últimos agregados) |
| `/libros` | `LibroList` | Listado con filtros |
| `/libros/gestionar` | `LibroForm` | Alta/edición/eliminación (selector interno, no usa `:id`) |
| `/libros/buscar` | `Buscar` | Paso 1-2 del flujo de importación externa |
| `/libros/buscar/importar` | `ConfirmarImportar` | Paso 3: revisión y confirmación |
| `/libros/:id` | `LibroDetail` | Detalle, incluye resumen generado por IA |
| `/autores` | `AutorList` | Listado |
| `/autores/gestionar` | `AutorForm` | Alta/edición/eliminación |
| `/autores/:id` | `AutorDetail` | Detalle, incluye biografía generada por IA |
| `/estadisticas` | `Dashboard` | 4 tabs (año, género, autor, país) + ritmo de lectura |

Patrón notable: `LibroForm` y `AutorForm` no usan `:id` en la ruta — es un selector interno (`libroSeleccionadoId`/similar) que carga el registro elegido desde un `<select>` propio, con `id === 0` como modo creación.

## Integración con los servicios backend

Todos los `*.service.ts` siguen el mismo patrón: `HttpClient` inyectado, `baseUrl` construida desde `environment.gatewayUrl`, un método por operación, retornando `Observable`.

| Service | Base URL | Backend destino |
|---|---|---|
| `LibroService`, `AutorService`, `GeneroService`, `PaisService`, `EstadisticaService`, `RecomendacionesService` | `{gatewayUrl}/api/...` | Backend Java (camelCase) |
| `BiografiaService`, `ResumenService`, `BusquedaLibrosService` | `{gatewayUrl}/ia/...` | agentes-ia (snake_case) |

Esta distinción de casing es deliberada y documentada en el propio código (`core/models/busqueda-externa.ts`): los modelos que hablan con Java van en camelCase (igual que sus DTOs Java), los que hablan con agentes-ia van en **snake_case sin traducir**, replicando el JSON real que produce Pydantic — evita una capa de mapeo que se rompería cada vez que cambie un schema en Python. La única excepción es la respuesta de `/importar`: agentes-ia la reenvía tal cual desde Java, así que el frontend la tipa como `LibroResponseDTO` (camelCase), no como un tipo propio del dominio agentes-ia.

## El flujo de importación externa (`Buscar` → `ConfirmarImportar`)

Es la pieza de negocio más compleja del frontend, espejo del flujo `/buscar → /resolver → /importar` de agentes-ia.

**Estado compartido vía `BusquedaLibrosService`** (signals en un servicio `providedIn: 'root'`, sin `localStorage`): guarda la query/resultados/paginación de la búsqueda y la selección ya resuelta (`SeleccionParaImportar`), para que la navegación de ida y vuelta entre `/libros/buscar` y `/libros/buscar/importar` no pierda contexto ni repita llamadas a `/resolver`. Si el usuario entra directo a `/libros/buscar/importar` (recarga de página, link directo) sin haber pasado por `Buscar`, `ConfirmarImportar.ngOnInit()` no encuentra selección guardada y redirige de vuelta.

**`Buscar`** es una máquina de estados de 3 pasos (`Paso`: `'busqueda' | 'seleccion-autor' | 'confirmacion-autor'`):
1. Búsqueda por texto en Google Books, paginada (`start_index` calculado desde el número de página).
2. Si el candidato elegido trae más de un autor, el usuario elige cuál antes de poder llamar a `/resolver` (el backend espera un único `autor_nombre`).
3. Llama a `/resolver`. Si la resolución del autor viene en banda `existente` o `nuevo`, navega directo a `ConfirmarImportar`. Si viene `requiere_confirmacion` (banda "dudosa" de agentes-ia), muestra al usuario los datos del candidato para que confirme si es la misma persona u otra distinta, y solo entonces navega.

**`ConfirmarImportar`** recibe la selección ya resuelta y permite edición local antes de confirmar:
- Datos del libro (título, ISBN, portada, año, estado, datos de lectura personal) vía `CamposLibro`.
- Si el autor es nuevo: datos del autor vía `CamposAutor` (prellenados con lo que resolvió Wikidata/Gemini, editables), y país (seleccionar uno existente o escribir uno nuevo).
- Géneros: agregar/quitar de la lista sugerida, mezclando géneros existentes y nuevos — toda esta edición es 100% local (signals), nada se persiste hasta el submit final.
- Al confirmar, arma el `ImportarLibroRequest` completo (snake_case) y llama a `POST /ia/busqueda-libros/importar`.

## Componentes compartidos reutilizables

- **`CamposLibro`** / **`CamposAutor`**: bloques de formulario reutilizados entre `LibroForm`/`ConfirmarImportar` y `AutorForm`/`ConfirmarImportar`. Reciben el *field tree* de Signal Forms (`form(...)`) más el signal de datos crudo, vía `input.required()`. Los campos cuyo tipo de dato difiere entre páginas consumidoras (ej. `autorId` como `<select>` simple en `LibroForm` vs. una `AutorResolucion` completa en `ConfirmarImportar`) quedan **fuera** del modelo del componente compartido y se proyectan con `ng-content` — cada página resuelve esa parte por su cuenta.
- **`CarruselLibros`**: carrusel paginado genérico (`CarruselItem`: id, portada, título, subtítulo opcional). Cada página consumidora mapea su propio DTO a esa forma antes de pasarlo; el carrusel no conoce ningún DTO del dominio. Paginación por bloques con `transform: translateX` animado; se resetea a la página 0 si cambia el arreglo completo de items (`effect()` + `untracked()`).
- **`PortadaLibro`**: imagen de portada con tamaño (`chico`/`grande`) y ancho configurables.

## Gráficos (`shared/graficos/`)

Cuatro wrappers delgados sobre `ng-apexcharts`, cada uno tomando un DTO de estadística y traduciéndolo a la config de Apex vía `computed()`:

| Componente | Tipo de gráfico | DTO de entrada | Uso |
|---|---|---|---|
| `GraficoBarras` | Barras horizontales apiladas | `ConteoDobleDTO[]` | Por autor / por país — series "Leídos" + "Por leer" en un único `apx-chart`, evita desalineación entre capas que ocurría con dos instancias superpuestas |
| `GraficoLineas` | Línea | `ConteoDTO[]` | Por año de lectura |
| `GraficoPie` | Torta | `ConteoDTO[]` | Por estado (con traducción de enum a etiqueta legible) |
| `GraficoTreemap` | Treemap | `ConteoDTO[]` | Por género |

`GraficoBarras` incluye una opción de "destacar top N" (usada para resaltar los 7 autores más leídos): en vez de colorear filas individuales (`distributed` no es compatible con `stacked` en ApexCharts), dibuja una banda de fondo semitransparente detrás de las primeras N filas vía `annotations.xaxis`.

## Modelo de datos (frontend)

`core/models/` tiene un archivo por entidad/flujo, reflejando exactamente los contratos de los otros dos servicios documentados:

- `libro.ts`, `autor.ts`, `genero.ts`, `pais.ts`, `estadistica.ts`, `recomendacion.ts`, `error-response.ts` — camelCase, calzan con los DTOs del backend Java.
- `biografia.ts`, `resumen.ts` — snake_case en el payload de request/response, calzan con los schemas Pydantic de agentes-ia.
- `busqueda-externa.ts` — el más extenso: replica el flujo completo de resolución de entidades de agentes-ia, incluidas las uniones discriminadas por campo `tipo` (`existente` / `nuevo` / `requiere_confirmacion` para autor; `existente` / `nuevo` para país y género), en snake_case.

## Configuración

`src/environments/environment.ts` (desarrollo):

```ts
export const environment = {
  production: false,
  firebaseConfig: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId },
  gatewayUrl: "http://localhost:8081"
};
```

No hay variables de entorno de shell (`.env`) como en backend/agentes-ia — Angular resuelve configuración por archivo de ambiente, seleccionado en build time (`environment.ts` para desarrollo, normalmente un `environment.prod.ts` para producción vía `fileReplacements` en `angular.json`, si existe).

Design system (`src/styles.scss`, `@theme` de Tailwind v4):
- Fuente serif `Cardo` (Google Fonts)
- Tokens de tamaño de texto propios: `--text-chico`, `--text-pequena`, `--text-mediana`, `--text-grande`
- Fondos con imagen (`--background-image-fondoN`) + capa de overlay semitransparente (`.overlay-fondo`) para legibilidad de texto sobre las imágenes

## Cómo levantar el frontend localmente

Requisitos: Node.js compatible con Angular 22, npm.

```bash
npm install
ng serve
# o: npm start
```

Disponible en `http://localhost:4200`. Requiere que el Gateway esté corriendo (por defecto `http://localhost:8081`, ver `environment.gatewayUrl`) para que cualquier llamada HTTP funcione — el frontend no tiene modo standalone sin backend.

```bash
ng build             # build de producción a dist/
ng test               # tests unitarios con Vitest
```

## Decisiones de diseño

- **Signal Forms en vez de Reactive Forms**: todo el estado de formulario vive en signals (`form(modelSignal, validators)`), consistente con el resto de la app (que ya usa signals para todo su estado local). Permite mutar el modelo crudo directamente cuando hace falta (ej. `CamposAutor` limpiando el campo de fecha que no corresponde al modo activo) sin pelear contra la capa de `FormGroup`/`FormControl` clásica.
- **Campos numéricos en `<select>` como `string` en el modelo**: patrón usado en varios formularios — el soporte nativo de `number` en `<select>` con `[formField]` resultó inestable en esta versión de Angular, así que el valor se mantiene como `string` (con `''` como sentinel de vacío) y se convierte a `number` recién al construir el DTO de salida.
- **Casing sin traducir según el backend destino**: en vez de normalizar todo a camelCase en el frontend y mapear en cada llamada, los modelos que hablan con agentes-ia se dejan en snake_case tal cual — menos código de mapeo, y los tipos TS documentan directamente el contrato real que viaja por HTTP.
- **Estado de flujo multi-página en el service, no en el componente**: tanto la búsqueda externa (`BusquedaLibrosService`) como la selección resuelta viven en un service raíz con signals, no en los componentes de página — sobrevive la navegación entre `/libros/buscar` y `/libros/buscar/importar` sin recurrir a `localStorage` (que además está prohibido en artifacts, aunque aquí no aplica esa restricción — es una decisión de alcance: el estado solo necesita sobrevivir la sesión de pestaña activa).
- **Componentes de formulario compartidos con proyección de contenido**: `CamposLibro`/`CamposAutor` cubren el subconjunto de campos con tipo de dato estable entre páginas consumidoras; los campos que cambian de forma (autor por id vs. autor con resolución IA) se proyectan vía `ng-content`, evitando bifurcar el componente o inflar su modelo con casos que no aplican en todas partes.
- **Componente de gráfico de barras apiladas en una sola instancia**: se abandonó un diseño con dos `apx-chart` superpuestos (uno por serie) porque generaba desalineación entre filas; una sola instancia con `stacked: true` garantiza que ambas series comparten el mismo layout interno.