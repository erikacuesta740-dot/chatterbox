# Valores de mercado de EA SPORTS FC 27

## Estado actual (10/10/2026)

- **Valores de FC 27 incluidos en el juego: 0.**
- **Jugadores con valor verificado: 0. Sin verificar: todos.**
- En el juego, todos los jugadores aparecen como **«No verificado»** en el apartado «Valor de mercado FC 27».

Motivos:

1. **No se ha podido acceder a ninguna fuente.** Desde el entorno de desarrollo, la red bloquea los sitios que publican
   la base de datos del Modo Carrera de FC 27 (por ejemplo, sofifa.com, cmtracker.net) y también ea.com. No se ha podido
   consultar ni comparar ningún valor, así que no se incluye ninguno.
2. **Los jugadores de la base de demostración son ficticios.** No existe un valor de FC 27 para un jugador inventado.
   Para tener valores oficiales hacen falta las plantillas reales (base importada) y, después, sus valores.
3. **Licencia.** Los datos de EA SPORTS FC son propiedad de Electronic Arts. Los sitios que los publican suelen
   prohibir su copia automatizada en sus condiciones de uso. Este proyecto no los copia: deja preparado un importador
   para que se incorporen desde una fuente que tengas permiso para usar.
4. **En FC 27 el valor no es fijo.** EA calcula el valor de transferencia esperado (xTV, en colaboración con TransferRoom)
   y lo actualiza durante la partida según forma, minutos, etc. Por eso un archivo importado debe indicar la fecha de consulta:
   lo que se importa es el valor que mostraba la fuente ese día (normalmente el inicial de la base de datos).

## Qué hace el juego con estos valores

- Guarda un **registro independiente** de las carreras (IndexedDB, clave `fc27Values`). Importar o vaciar el registro
  nunca modifica ni borra una carrera guardada.
- Cada entrada guarda: identificador único, nombre, club, importe (entero exacto), moneda, texto original de la fuente,
  edición, fuente, enlace, fecha de consulta, fecha de importación y estado de verificación.
- El importe **no se redondea ni se recalcula**. Se muestra el texto original de la fuente («85.000.000 €») y, si la fuente lo da
  abreviado («€85.5M»), se indica.
- Solo se aceptan entradas que declaren la edición **FC 27**. Las de FC 26 u otra edición, las que no tienen valor, fuente,
  identificador o moneda se rechazan y se listan en el informe. Nunca se rellenan con estimaciones.
- Volver a importar un jugador con el mismo identificador **actualiza** su entrada (se guarda el valor anterior); no crea duplicados.
- El enlace con los jugadores de una carrera se hace por **identificador externo** (`id` del jugador en la base de plantillas).
  Si una base no trae identificadores, se usa nombre + club exactos y la ficha indica «Enlazado por nombre y club».
  Los jugadores ficticios nunca reciben un valor FC 27.
- **Estado de verificación:** el juego no puede comprobar por sí solo que un importe sea correcto. Muestra «Verificado según la
  fuente» cuando el archivo marca la entrada como verificada (`verified: true`), e «Importado, no verificado» en caso contrario.
- El juego mantiene aparte su propio **valor estimado** (calculado a partir de media, edad y potencial) para su economía interna.
  Se etiqueta siempre como «Valor estimado del juego» y nunca se presenta como valor de FC 27.
- El precio que pida un club, las ofertas, contraofertas y cesiones (Etapa 2) son cantidades distintas y no escriben en este registro.

## Formato de importación

Desde **Ajustes › Valores de mercado FC 27**, como archivo o pegando el texto.

CSV (la cabecera es obligatoria; se admite `,` o `;` como separador):

```
id,name,club,value,currency,edition,source,sourceUrl,retrievedAt,verified
239085,Nombre Apellido,Club,"85.000.000 €",EUR,FC 27,Nombre de la fuente,https://...,2026-10-10,true
```

JSON:

```json
{
  "edition": "FC 27",
  "source": "Nombre de la fuente",
  "sourceUrl": "https://...",
  "retrievedAt": "2026-10-10",
  "currency": "EUR",
  "players": [
    { "id": "239085", "name": "Nombre Apellido", "club": "Club", "value": 85000000, "raw": "85.000.000 €", "verified": true }
  ]
}
```

- `id` debe coincidir con el `id` del jugador en la base de plantillas importada (ver DATA_FORMAT.md).
- `value` puede ser un entero o el texto tal como aparece en la fuente. No se admiten decimales en la unidad monetaria.
- `raw` (opcional) es el texto exacto mostrado por la fuente.

## Cómo comprobar una importación

1. Revisa el informe que aparece al importar: nuevos, actualizados, sin cambios, rechazados y el motivo de cada rechazo.
2. En Ajustes verás cuántos valores tiene el registro y, para la carrera abierta, cuántos jugadores tienen valor verificado,
   cuántos sin verificar y cuántos no tienen valor.
3. Abre la ficha de varios jugadores de distintos clubes y niveles y compara el importe con la fuente.
