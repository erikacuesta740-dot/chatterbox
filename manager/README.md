# Modo Carrera Manager

Simulador de gestión futbolística pensado para jugar desde el iPhone. Eres entrenador y director
deportivo: eliges el once y la táctica, fichas, vendes, renuevas, cuidas la cantera y gestionas el dinero;
los partidos se simulan.

> **Datos.** 31 ligas masculinas (las de EA SPORTS FC 26 que conoce el asistente; la lista exacta de FC 27 no está verificada),
> unos 590 clubes de la temporada 2025/26 y unos 5.000 jugadores reales según el conocimiento del asistente hasta mediados
> de 2026, **no verificados**: medias y potenciales son estimaciones, no las de FC 27, y puede faltar algún fichaje reciente.
> Las grandes ligas están casi completas; en ligas pequeñas y categorías inferiores los huecos se completan con jugadores
> ficticios marcados como tales, igual que los agentes libres. **No hay valores de mercado de FC 27** hasta que se importen.
> Nada de esto son datos oficiales de EA SPORTS FC.

## Qué incluye

**Carreras, competiciones y partidos**
- Carreras independientes: crear, continuar, renombrar y eliminar (con confirmación).
- 31 ligas: España (2), Inglaterra (4), Italia (2), Alemania (3), Francia (2), Portugal, Países Bajos, Bélgica, Escocia,
  Turquía, Austria, Suiza, Dinamarca, Noruega, Suecia, Polonia, Irlanda, Rumanía, Arabia Saudí, MLS, Argentina, Corea y Australia,
  más clubes europeos invitados para completar las competiciones UEFA.
- Ascensos y descensos reales con playoffs: Segunda (3º-6º, ida y vuelta), Championship/League One/League Two (semifinales
  a doble partido y final única), Serie B (3º-8º), 2. Bundesliga y 3. Liga (promoción contra el antepenúltimo de arriba) y
  Ligue 2 (eliminatorias y promoción).
- Copas nacionales (Copa del Rey, FA Cup, Coppa Italia, DFB-Pokal, Coupe de France) con prórroga y penaltis.
- Champions, Europa League y Conference League con fase liga de 36 equipos, playoffs, eliminatorias a doble partido y final.
- Calendario por fechas: jornadas de fin de semana, partidos entre semana y parones internacionales; recuperación física diaria.
- Partido en directo con comentarios, descanso con cambios y ajustes tácticos; o simulación de uno, varios o toda la temporada.
- Tácticas (7 formaciones, mentalidad, presión, ritmo), dorsales, capitán y lanzadores; once manual o automático con avisos.
- Lesiones, cansancio, sanciones; fin de temporada con ascensos, descensos, clasificación europea e historial.

**Mercado y contratos (Etapa 2)**
- Ventanas de verano (hasta el 1 de septiembre) e invierno (1 de enero – 2 de febrero). Fuera de ellas solo agentes libres y renovaciones.
- Búsqueda por nombre, posición, liga, club, nacionalidad, edad, media, potencial y precio.
- Negociación en dos fases: con el club (traspaso o cesión, con contraofertas y paciencia) y con el jugador (salario, años y prima).
- Ofertas recibidas por tus jugadores (aceptar, rechazar o pedir más), lista de transferibles, cesiones, rescisiones y renovaciones.
- Contratos que vencen: si no renuevas, el jugador se va libre en junio.
- Presupuesto de fichajes y presupuesto salarial (euros por semana), reasignables. Ninguna operación puede superarlos.
- Taquilla, derechos de TV, premios, gastos y balance por temporada. La IA también ficha entre clubes.

**Profundidad (Etapa 3)**
- Cantera con hornada anual, promoción al primer equipo y liberación.
- Progresión durante la temporada según edad, potencial y minutos; consolidación al final de la temporada.
- Moral según los minutos que espera cada rol; los descontentos piden salir.
- Confianza de la directiva, rumores y noticias generadas a partir de lo que pasa en la partida.

**Carrera del entrenador**
- Reputación, despidos, dimisión, ofertas de otros clubes y cambio de equipo.
- Premios: Balón de Oro, mejor jugador, máximo goleador, mejor portero y mejor joven por liga, equipo de la temporada, entrenador del año.
- Vitrina de títulos, palmarés y récords del club, trayectoria de cada jugador.

**Día a día**
- Entrenamiento (intensidad) y planes de desarrollo: atributo a mejorar o reconversión de posición.
- Red de ojeadores (1–5 estrellas) por regiones: el potencial de jugadores ajenos se ve como rango hasta tener informe; ojeadores juveniles proponen promesas para la cantera.
- Charlas con jugadores (elogiar, exigir, prometer minutos, explicar su papel) y ruedas de prensa con efecto en vestuario y directiva.

**Cuentas y guardado online (Etapa 4)**
- Dentro de claude.ai, cada persona guarda sus carreras en su propio espacio privado de la base de datos del juego:
  nadie más puede leerlas ni modificarlas (ni siquiera el propietario del juego).
- Se continúa desde cualquier dispositivo abriendo el mismo enlace con la sesión iniciada.
- Copia local en el dispositivo (funciona sin conexión) y subida en segundo plano. Las carreras creadas antes se pueden subir a tu cuenta.

**Instalación (Etapa 5)**
- PWA instalable con icono y funcionamiento sin conexión cuando se aloja en su propia web (por ejemplo, GitHub Pages).

## Carrera online contra un amigo

En la pantalla de inicio, «Jugar online con un amigo»:
1. Uno crea la sala y elige la liga (el mundo incluye las demás ligas de ese país, copas y Europa) y su club.
2. El otro escribe el código de la sala y elige otro club de esa liga.
3. Cada uno dirige su once, táctica y lanzadores desde su móvil. Al pulsar los dos «Listo», se juega hasta el
   siguiente partido de cualquiera de los dos. Hay cara a cara, clasificación y cambio de temporada.

Funciona solo dentro de claude.ai (las salas viven en la base de datos del juego): el amigo debe estar invitado por
correo como **Editor** y el enlace público desactivado. En este modo no hay fichajes, cantera ni prensa.

## Jugar con tu hermano

1. Abre el juego en claude.ai y pulsa **Compartir**.
2. Invítale por correo como **Editor**. No actives el enlace público: con él, los invitados de fuera de tu organización pierden el permiso de escritura.
3. Él necesita una cuenta de claude.ai y abrir el enlace con su sesión iniciada.

No hace falta ningún servicio adicional ni ningún pago aparte de las cuentas de claude.ai.

## Instalar en el iPhone

- **Desde claude.ai** (recomendado para el guardado online): abre el enlace del juego en la app de Claude.
- **Como app independiente**: cuando el código esté en GitHub, activa Pages (Settings → Pages → Source: «GitHub Actions»);
  el flujo `.github/workflows/modo-carrera-pages.yml` publica la carpeta `manager/`. Abre la web en Safari →
  Compartir → «Añadir a pantalla de inicio». Esa versión guarda las carreras **solo en el iPhone** (el guardado online
  depende de claude.ai).

## Datos reales: cómo importarlos

1. **Plantillas** (JSON): ligas, clubes y jugadores con `id`, nombre, posición, edad, media y potencial
   (formato en `docs/DATA_FORMAT.md`). Se importan en Ajustes › Base de datos de plantillas y se eligen al crear una carrera.
2. **Valores de mercado FC 27** (CSV o JSON): `id,name,club,value,currency,edition,source,sourceUrl,retrievedAt,verified`
   (ver `docs/FC27_VALUES.md`). Solo se aceptan datos de FC 27; nunca se redondean ni se rellenan con estimaciones.

## Arquitectura

Web estática sin dependencias ni compilación.

```
index.html, manifest.webmanifest, sw.js, icons/   Página, instalación y modo sin conexión
css/app.css                                       Estilos (móvil primero, tema claro y oscuro)
js/core/util.js                                   Azar con semilla, formatos
js/data/                                          Ligas, plantillas reales, nombres, valores FC 27, generador
js/engine/                                        Jugadores, alineaciones, calendario, partidos, mercado, cantera, carrera
js/store/storage.js, cloud.js                     Guardado local (IndexedDB) y online privado (claude.ai)
js/ui/                                            Componentes y pantallas de mercado, finanzas y cantera
js/app.js                                         Navegación y pantallas principales
tests/                                            Pruebas del motor, del navegador y del guardado online
tools/build-single.js                             Empaqueta todo en un único HTML
```

## Pruebas

```
npm test                      # 29 pruebas: calendario, simulación, mercado, contratos, cantera, valores FC 27...
npm run serve                 # servidor local en :8765
node tests/e2e.js             # recorrido completo en un navegador con tamaño de iPhone
node tests/cloud-e2e.js       # guardado online, otro dispositivo y privacidad entre usuarios (base simulada)
node tests/online-e2e.js      # modo online con dos navegadores a la vez (base simulada)
npm run build                 # dist/modo-carrera-manager.html (archivo único)
node tools/check-data.js      # revisa ligas y plantillas reales
node tools/sync-scripts.js    # enlaza en index.html los archivos de js/data/rosters y js/data/world
```
