# Formato de datos importables

El juego trae una **base de demostración**: clubes y estadios reales aproximados a la temporada 2025/26
y **jugadores ficticios generados**. No son datos oficiales de EA Sports FC ni de ninguna liga.

Para usar datos legítimos (por ejemplo, una base con licencia o creada por ti), el generador
(`js/data/generator.js`, función `buildWorld`) acepta un dataset con esta forma:

```json
{
  "info": { "id": "mi-base-2026", "name": "Mi base 2026/27", "isDemo": false },
  "leagues": [
    {
      "id": "ESP1", "name": "Primera División", "country": "España", "nat": "ESP", "tier": 1,
      "lower": "ESP2", "relegate": 3, "euro": 6, "ucl": 4, "wealth": 1.0,
      "clubs": [
        {
          "name": "Club Ejemplo", "short": "EJE", "rep": 75, "stadium": "Estadio Ejemplo",
          "colors": ["#ffffff", "#003399"], "budget": 25000000,
          "players": [
            { "id": "239085", "name": "Nombre Apellido", "age": 24, "nat": "ESP", "pos": "MC", "alt": ["MCO"],
              "ovr": 78, "pot": 84, "wage": 40000, "contractEnd": 2029 }
          ]
        }
      ]
    },
    { "id": "ESP2", "name": "Segunda División", "country": "España", "nat": "ESP", "tier": 2,
      "upper": "ESP1", "promote": 3, "wealth": 0.35, "clubs": [] }
  ]
}
```

Reglas:

- Posiciones válidas: `POR, DFC, LD, LI, MCD, MC, MCO, MD, MI, ED, EI, DC`.
- `id` del jugador es su identificador único en tu base (se conserva como `extId` y sirve para enlazar valores FC 27).
- El valor de mercado de FC 27 **no va aquí**: se importa aparte, con su fuente (ver FC27_VALUES.md).
- `wage` es **euros por semana** (la única unidad de salario del juego).
- `contractEnd` es el año en que termina el contrato (30 de junio).
- `attrs` es opcional. Para jugadores de campo: `pac, sho, pas, dri, def, phy`; para porteros: `div, han, kic, ref, spd, pos`.
  Si falta, se generan a partir de la media y la posición.
- Si un club no trae `players`, su plantilla se genera automáticamente según `rep` (reputación 1–100).
- Para que haya ascensos y descensos, la liga superior debe indicar `lower` y `relegate`, y la inferior `upper` y `promote`.
- Un filial se marca con `"reserveOf": "<id del primer equipo>"` y nunca asciende a la liga de su primer equipo.

Se importa desde **Ajustes › Base de datos de plantillas** y se elige en **Nueva carrera**. Las carreras existentes no cambian.
