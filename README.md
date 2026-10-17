# Protocolos

Aplicación web (PWA instalable y offline) que organiza el día según el reloj biológico
—luz, cafeína, ejercicio, temperatura y descanso— a partir de las ideas del libro
*Protocols: An Operating Manual for the Human Body* (Andrew D. Huberman, 2026).

## Características

Navegación inferior en móvil y superior en escritorio con cuatro secciones:

- **Hoy** (`/`): reloj de 24 h con la franja de sueño, las ventanas de luz natural y
  tenue, la ventana de cafeína y el mínimo de temperatura. Plan del día con 15 tareas
  calculadas a partir de tu hora de despertar, de dormir y de la puesta de sol, con
  casillas y la siguiente tarea resaltada.
- **Herramientas** (`/herramientas`): suspiro fisiológico guiado, NSDR guiado de
  10/20/30 min con voz (y el audio de Spotify de la duración elegida) y temporizador de
  frío con contador de «muros» y registro semanal.
- **Semana** (`/semana`): plan base de ejercicio (3 fuerza, 3 cardio, 1 descanso), zonas
  de frecuencia cardiaca según edad y fórmula, y agua durante el ejercicio.
- **Biblioteca** (`/biblioteca`): los 47 protocolos resumidos, con buscador y filtro.

Los datos (horarios, casillas, sesiones de frío) se guardan solo en el navegador
(`localStorage`, prefijo `ritmo-diario:v1:`). No hay cuentas ni servidor.

## Stack

React + TypeScript + Vite, React Router, `vite-plugin-pwa`, Vitest. CSS propio con
tokens de diseño (`src/index.css`) y modo claro/oscuro. Se despliega como **Worker de
Cloudflare con Static Assets** (sin backend).

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint && npm run test && npm run build
```

| Script            | Descripción                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo.                       |
| `npm run build`   | Comprobación de tipos y build en `dist/`.     |
| `npm run preview` | Sirve el build de `dist/`.                    |
| `npm run lint`    | ESLint (0 avisos).                            |
| `npm run test`    | Tests unitarios.                              |
| `npm run deploy`  | `build` + `wrangler deploy`.                  |

## Estructura

```
public/               Iconos PWA, favicon y _headers
src/
  components/         Layout, reloj (Dial), controles y herramientas guiadas
  hooks/              useNow, useDayChecks
  lib/                plan.ts (plan diario y semanal), protocols.ts, nsdr.ts,
                      time.ts, storage.ts, device.ts (sonido, voz, pantalla)
  pages/              Una página por ruta
  store/              Ajustes persistidos (SettingsProvider)
```

## Despliegue continuo en Cloudflare

Cloudflare → **Workers & Pages → Create → Workers → Import a repository** →
`Laura0618/ritmo-diario`. Build command `npm run build`, deploy command
`npx wrangler deploy`. Cada `git push` a `main` redespliega. La versión de Node se toma
de `.node-version` (22).

## Descargo

Resumen propio de las ideas del libro, sin afiliación con el autor ni la editorial. No
es consejo médico: consulta a un profesional antes de tomar suplementos, empezar con el
frío o cambiar tu entrenamiento si tienes alguna condición de salud.
