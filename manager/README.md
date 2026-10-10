# Modo Carrera Manager

Simulador de gestión futbolística pensado para jugar desde el iPhone. Eres entrenador y director
deportivo: eliges el once, la táctica y gestionas la temporada; los partidos se simulan.

> Los clubes y estadios son reales (aproximados a 2025/26). **Los jugadores son ficticios** y las
> reputaciones son estimaciones propias. No son datos oficiales de EA Sports FC.

## Estado: Etapa 1 (base jugable)

Funciona:

- Menú principal con las 13 secciones y navegación con pestañas para el pulgar.
- Carreras independientes: crear, continuar, renombrar y eliminar (con confirmación). Crear una carrera nunca modifica otra.
- 7 ligas y 142 clubes: Primera y Segunda (España), Premier League y Championship (Inglaterra), Serie A, Bundesliga y Ligue 1.
- Plantillas de 23–24 jugadores con media, potencial, atributos, valor, salario (€/semana), contrato, forma física, moral y forma.
- Calendario a doble vuelta sin partidos duplicados, con fechas.
- Simulación de partidos: marcador, goles con minuto y asistente, posesión, tiros, tiros a puerta, xG, córners, faltas, tarjetas,
  lesiones, cambios, valoraciones, mejor jugador y crónica.
- Simular solo tu partido o la jornada entera (con confirmación). El resto de ligas avanza a la vez.
- Clasificación con zonas, forma y goleadores de todas las ligas.
- Tácticas: 7 formaciones, once manual o automático, mentalidad, presión y ritmo (influyen en la simulación), avisos de jugadores fuera de posición, lesionados, sancionados o cansados.
- Lesiones, cansancio, moral, acumulación de tarjetas y sanciones (versión básica).
- Fin de temporada: campeón, historial, ascensos y descensos (España e Inglaterra), evolución de jugadores según edad, potencial y minutos, retiradas, canteranos y nueva temporada.
- Noticias generadas a partir de lo que pasa en tu carrera.
- Guardado automático **local** (IndexedDB) y exportación/importación de una carrera como texto.

Pendiente (próximas etapas):

- Etapa 2: ofertas, negociación, ventas, cesiones, agentes libres firmables, renovaciones y finanzas detalladas.
  (Hoy el mercado y los agentes libres se pueden consultar, pero no fichar.)
- Etapa 3: cantera y moral en profundidad, objetivos y noticias más ricas, equilibrio a largo plazo.
- Etapa 4: cuentas, guardado online y privacidad por usuario.
- Etapa 5: datos ampliados, publicación definitiva e instalación en el iPhone (PWA).

## Arquitectura

Web estática sin dependencias ni compilación: HTML + CSS + JavaScript. Se puede alojar en cualquier
servidor de archivos estáticos y editar desde cualquier sitio.

```
index.html            Página principal
css/app.css           Estilos (móvil primero, tema claro y oscuro)
js/core/util.js       Azar con semilla, formatos
js/data/              Ligas y clubes (demo), nombres ficticios, generador de mundo
js/engine/            Jugadores, alineaciones, calendario, simulación, carrera
js/store/storage.js   Guardado (IndexedDB → localStorage → memoria); interfaz lista para la nube
js/ui/components.js   Escudos genéricos, insignias, barras, filas
js/app.js             Pantallas y acciones
tests/                Pruebas del motor (node:test) y de extremo a extremo (Playwright)
tools/build-single.js Empaqueta todo en un único HTML
```

Cada partido usa una semilla derivada de la carrera, así que el mismo estado produce el mismo resultado.

## Pruebas

```
npm test          # motor: calendario, simulación, independencia, sanciones, 3 temporadas
npm run e2e       # navegador con tamaño iPhone (requiere servidor: npm run serve)
npm run build     # genera dist/modo-carrera-manager.html (un único archivo)
```
