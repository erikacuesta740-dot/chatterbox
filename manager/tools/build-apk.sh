#!/usr/bin/env bash
# Compila la app Android (APK) sin Android Studio: aapt2 + javac + dx + firma v1/v2/v3.
# Variables necesarias (ver README): AAPT2, ANDROID_JAR (android-all de Robolectric o android.jar), DX_JAR,
# SIGNER (sign.mjs), KEY y CERT (PEM). Opcionales: COVER (jpg de portada), ICONS (carpeta con ic_<densidad>.png), OUT.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT:-$ROOT/dist/android}"
W="$OUT/work"
rm -rf "$W" && mkdir -p "$W/res" "$W/assets/www" "$W/classes"
# 1) Juego en un solo HTML (con portada si se indica)
node "$ROOT/tools/build-single.js" "$W/assets/www/index.html" ${COVER:+--cover "$COVER"}
# 2) Recursos: estilos + iconos
cp -r "$ROOT/android/res/." "$W/res/"
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p "$W/res/mipmap-$d"
  if [ -n "${ICONS:-}" ] && [ -f "$ICONS/ic_$d.png" ]; then cp "$ICONS/ic_$d.png" "$W/res/mipmap-$d/ic_launcher.png";
  else cp "$ROOT/icons/icon-192.png" "$W/res/mipmap-$d/ic_launcher.png"; fi
done
"$AAPT2" compile --dir "$W/res" -o "$W/res.zip"
"$AAPT2" link -o "$W/unsigned.apk" -I "$ANDROID_JAR" --manifest "$ROOT/android/AndroidManifest.xml" \
  --min-sdk-version 24 --target-sdk-version 34 -A "$W/assets" "$W/res.zip"
# 3) Código
javac -nowarn --release 8 -cp "$ANDROID_JAR" -d "$W/classes" $(find "$ROOT/android/src" -name '*.java') 2>&1 | grep -v "^warning\|^Note\|bootstrap" ; test -f "$W/classes/com/modocarrera/manager/MainActivity.class"
java -cp "$DX_JAR" com.android.dx.command.Main --dex --output="$W/classes.dex" "$W/classes"
(cd "$W" && zip -q unsigned.apk classes.dex)
# 4) Alineación (4 bytes para entradas sin comprimir) y firma
python3 "$ROOT/tools/zipalign.py" "$W/unsigned.apk" "$W/aligned.apk"
node "$SIGNER" "$W/aligned.apk" "$OUT/modo-carrera-manager.apk" "$KEY" "$CERT"
ls -la "$OUT/modo-carrera-manager.apk"
