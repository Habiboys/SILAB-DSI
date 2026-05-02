# 📋 Panduan Script Generator Diagram SILAB

Dua script Node.js untuk generate diagram Draw.io dari source code / PlantUML.

---

## 🗂️ Daftar Script

| Script | Fungsi |
|---|---|
| `gen_cd.cjs` | Laravel Models → **Class Diagram** Draw.io |
| `gen_ad.cjs` | PlantUML `.puml` → **Activity Diagram** Draw.io |

---

## 1. `gen_cd.cjs` — Class Diagram

Generate class diagram dari semua model Laravel di `app/Models/`.

### Perintah

```powershell
node gen_cd.cjs
```

### Output

```
class_diagram_silab.drawio   ← di root project
```

---

## 2. `gen_ad.cjs` — Activity Diagram

Konversi file `.puml` (PlantUML Activity Diagram) ke format `.drawio`.
Output selalu disimpan **di folder yang sama** dengan file `.puml`.

### Perintah

```powershell
# Konversi 1 file
node gen_ad.cjs docs\auth\activity\ACT_01_LOGIN.puml

# Konversi 1 folder (semua .puml di dalamnya)
node gen_ad.cjs docs\auth\activity

# Konversi SEMUA folder docs (rekursif)
node gen_ad.cjs docs

# Konversi 1 file, output ke path custom
node gen_ad.cjs docs\auth\activity\ACT_01_LOGIN.puml output\LOGIN.drawio
```

### Contoh Output

```
docs\auth\activity\ACT_01_LOGIN.puml    →  docs\auth\activity\ACT_01_LOGIN.drawio
docs\auth\activity\ACT_02_REGISTER.puml →  docs\auth\activity\ACT_02_REGISTER.drawio
...
```

### Elemen PlantUML yang Didukung

| Elemen PlantUML | Keterangan |
|---|---|
| `\|Lane\|` | Swimlane / kolom aktor |
| `start` / `stop` | Node awal & akhir |
| `:Aksi;` | Kotak aksi |
| `if (...) then (...)` | Percabangan (diamond) |
| `elseif (...) then (...)` | Cabang tambahan |
| `else (...)` | Cabang lain |
| `endif` | Akhir percabangan |
| `title ...` | Judul diagram |

---

## ⚡ Quick Commands (Copy-Paste)

```powershell
# Class Diagram
node gen_cd.cjs

# Activity — semua sekaligus
node gen_ad.cjs docs

# Activity — per modul
node gen_ad.cjs docs\auth\activity
node gen_ad.cjs docs\praktikum\activity
node gen_ad.cjs docs\keuangan\activity
node gen_ad.cjs docs\inventaris\activity
node gen_ad.cjs docs\piket\activity
node gen_ad.cjs docs\surat\activity
node gen_ad.cjs docs\kuesioner\activity
node gen_ad.cjs docs\kegiatan_proker\activity
```

---

> **Catatan:** Semua perintah dijalankan dari root folder project:
> `d:\Nouval\TA\silab-backup-2-januari-2026\silab\`
