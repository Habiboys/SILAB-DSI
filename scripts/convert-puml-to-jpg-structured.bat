@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM =============================================================
REM Convert all .puml under /docs into JPG with structured output:
REM docs\images\<nama_module>\<nama_diagram>\gambar.jpg
REM
REM Usage:
REM   1) Put plantuml.jar somewhere (default: tools\plantuml.jar)
REM   2) Run from project root:
REM      scripts\convert-puml-to-jpg-structured.bat
REM
REM Optional environment override before run:
REM   set PLANTUML_JAR=C:\path\to\plantuml.jar
REM =============================================================

set "PROJECT_ROOT=%~dp0.."
for %%I in ("%PROJECT_ROOT%") do set "PROJECT_ROOT=%%~fI"

set "DOCS_DIR=%PROJECT_ROOT%\docs"
set "OUTPUT_ROOT=%DOCS_DIR%\images"
set "PNG2JPG_PS1=%PROJECT_ROOT%\scripts\convert-png-to-jpg.ps1"

if not defined PLANTUML_JAR set "PLANTUML_JAR=%PROJECT_ROOT%\tools\plantuml.jar"

if not exist "%DOCS_DIR%" (
  echo [ERROR] Folder docs tidak ditemukan: "%DOCS_DIR%"
  exit /b 1
)

where java >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Java tidak ditemukan di PATH. Install JDK/JRE terlebih dahulu.
  exit /b 1
)

if not exist "%PLANTUML_JAR%" (
  echo [ERROR] plantuml.jar tidak ditemukan: "%PLANTUML_JAR%"
  echo         Set manual dengan:
  echo         set PLANTUML_JAR=C:\path\to\plantuml.jar
  exit /b 1
)

if not exist "%PNG2JPG_PS1%" (
  echo [ERROR] Script konversi PNG ke JPG tidak ditemukan: "%PNG2JPG_PS1%"
  exit /b 1
)

if not exist "%OUTPUT_ROOT%" mkdir "%OUTPUT_ROOT%"

set /a TOTAL=0
set /a SUCCESS=0
set /a FAILED=0

echo [INFO] Mulai konversi .puml -^> .jpg
echo [INFO] Source : "%DOCS_DIR%"
echo [INFO] Output : "%OUTPUT_ROOT%"
echo.

for /r "%DOCS_DIR%" %%F in (*.puml) do (
  set /a TOTAL+=1

  set "SRC=%%~fF"
  set "SRC_DIR=%%~dpF"
  set "FILE_NAME=%%~nF"
  set "SKIP_FILE=0"

  REM Skip jika file sudah berada di docs\images
  echo "!SRC!" | findstr /I /C:"\docs\images\" >nul
  if not errorlevel 1 (
    echo [SKIP] !SRC!
    set "SKIP_FILE=1"
  )

  if "!SKIP_FILE!"=="0" (
    REM Relative folder dari docs
    set "REL_DIR=!SRC_DIR:%DOCS_DIR%\=!"

    REM Ambil nama module = folder pertama setelah docs\
    set "MODULE=umum"
    for /f "tokens=1 delims=\" %%M in ("!REL_DIR!") do (
      if not "%%M"=="" set "MODULE=%%M"
    )

    set "TARGET_DIR=%OUTPUT_ROOT%\!MODULE!\!FILE_NAME!"
    if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!"

    REM Replace mode: hapus hasil generate lama agar selalu fresh
    del /f /q "!TARGET_DIR!\gambar*.jpg" >nul 2>nul
    del /f /q "!TARGET_DIR!\!FILE_NAME!*.png" >nul 2>nul

    echo [PROC] %%~nxF  ^>  !TARGET_DIR!\gambar.jpg

    REM PlantUML terbaru menghasilkan PNG; kita convert PNG -> JPG
    java -jar "%PLANTUML_JAR%" -charset UTF-8 -output "!TARGET_DIR!" "!SRC!"
    if errorlevel 1 (
      echo [FAIL] Gagal render: !SRC!
      set /a FAILED+=1
    ) else (
      set "FOUND_IMAGE=0"
      set /a IMG_INDEX=0
      for /f "delims=" %%P in ('dir /b /a-d "!TARGET_DIR!\!FILE_NAME!*.png" 2^>nul') do (
        set "FOUND_IMAGE=1"
        set "PNG_FILE=!TARGET_DIR!\%%P"

        set "OUT_NAME=gambar.jpg"
        if !IMG_INDEX! GTR 0 set "OUT_NAME=gambar_!IMG_INDEX!.jpg"

        powershell -NoProfile -ExecutionPolicy Bypass -File "%PNG2JPG_PS1%" -InputPath "!PNG_FILE!" -OutputPath "!TARGET_DIR!\!OUT_NAME!" -Quality 90 >nul 2>nul
        if exist "!TARGET_DIR!\!OUT_NAME!" (
          del /f /q "!PNG_FILE!" >nul 2>nul
        )

        set /a IMG_INDEX+=1
      )

      if "!FOUND_IMAGE!"=="1" if exist "!TARGET_DIR!\gambar.jpg" (
        set /a SUCCESS+=1
      ) else (
        echo [FAIL] Output tidak ditemukan untuk: !SRC!
        set /a FAILED+=1
      )
    )
  )
)

echo.
echo [DONE] Total   : %TOTAL%
echo [DONE] Sukses  : %SUCCESS%
echo [DONE] Gagal   : %FAILED%

if %FAILED% GTR 0 (
  exit /b 2
)

exit /b 0
