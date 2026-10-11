# App Android (APK)

Envoltorio WebView que sirve el juego desde los assets con un origen https propio (`app.modocarrera.local`),
así IndexedDB guarda las carreras en el móvil. Sin dependencias de AndroidX.

Compilación sin Android Studio (`tools/build-apk.sh`):
- `AAPT2`: binario aapt2 (p. ej. del paquete npm `aaptjs3`).
- `ANDROID_JAR`: `org.robolectric:android-all` (Maven Central) o un `android.jar` del SDK.
- `DX_JAR`: `com.jakewharton.android.repackaged:dalvik-dx` (Maven Central).
- `SIGNER`: script que firma con `apk_sign_ts` (v1 + v2 + v3); `KEY`/`CERT`: `android/signing/*.pem`.
- `ICONS`: carpeta con `ic_<densidad>.png` para el icono del escritorio (la foto no se guarda en el repositorio).

`signing/`: clave personal de esta app. Las actualizaciones deben firmarse con la misma clave para instalarse
encima sin perder las carreras guardadas. Repositorio privado: no publicar.
