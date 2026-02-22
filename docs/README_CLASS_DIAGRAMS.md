# Dokumentasi Class Diagram - Sistem SILAB

## 📋 Daftar File Class Diagram

Dokumentasi ini berisi **class diagram lengkap** untuk sistem SILAB Laravel, mencakup **40+ Model** dengan attributes, methods, dan relationships.

### 🎯 0. CLASS_00_COMPREHENSIVE_OVERVIEW.puml
**Tipe:** Overview / Big Picture  
**Jumlah Classes:** 40+ (simplified)

**Deskripsi:**  
Diagram overview yang menampilkan semua model utama dalam sistem dengan color-coding berdasarkan domain:
- 🟠 **Core Authentication** (Orange): User, Role, Permission, Lab
- 🔵 **Academic** (Blue): Praktikum, Tugas, Penilaian
- 🟢 **Operational** (Green): Inventaris, Keuangan
- 🟣 **Activities** (Purple): Kegiatan, Proker, Piket
- 🟡 **Communication** (Yellow): Surat, Sertifikat

**Gunakan untuk:** High-level system understanding, presentasi stakeholder

---

### 🔐 1. CLASS_01_CORE_AUTH.puml
**Domain:** Core Authentication & Authorization  
**Jumlah Classes:** 11

**Classes:**
- `User` - Central authentication entity
- `Role` - Spatie role model
- `Permission` - Spatie permission model
- `ModelHasRoles` - Junction table
- `ModelHasPermissions` - Junction table
- `RoleHasPermissions` - Junction table
- `Laboratorium` - Lab entity
- `TahunKepengurusan` - Academic year periods
- `KepengurusanLab` - Active period management (multi-tenancy core)
- `Struktur` - Position/job title structure
- `Anggota` - Membership in kepengurusan
- `StrukturPermissions` - Position-based permissions (PBAC)

**Key Features:**
- ✅ Spatie Laravel Permission integration
- ✅ Multi-tenancy via `KepengurusanLab`
- ✅ Hybrid security: RBAC + PBAC
- ✅ Dynamic permission assignment

---

### 🔬 2. CLASS_02_PRAKTIKUM.puml
**Domain:** Academic / Praktikum Module  
**Jumlah Classes:** 13

**Classes:**
- `Praktikum` - Core practicum entity
- `AslabPraktikum` - Assistant assignment (junction)
- `Praktikan` - Student enrollment
- `ModulPraktikum` - Study materials
- `PertemuanPraktikum` - Class sessions
- `Absensi` - Attendance tracking
- `TugasPraktikum` - Assignments
- `PengumpulanTugas` - Submission tracking
- `RubrikPenilaian` - Grading rubric
- `KomponenRubrik` - Rubric components
- `NilaiRubrik` - Component-based scores
- `NilaiTambahan` - Bonus/penalty scores

**Key Features:**
- ✅ Complete academic workflow
- ✅ Flexible grading system (manual + rubrik)
- ✅ Auto-create absensi on pertemuan creation
- ✅ Weighted score calculation
- ✅ Excel import/export support

**Methods Highlighted:**
- `calculateNilaiAkhir()` - Final grade calculation
- `getNilaiWithRubrik()` - Rubrik-based grading
- `validateBobot()` - Ensure rubrik weights = 100%

---

### 📦 3. CLASS_03_INVENTARIS_KEUANGAN.puml
**Domain:** Operational (Asset & Finance)  
**Jumlah Classes:** 5

**Inventaris:**
- `KategoriAset` - Asset categories
- `DetailInventaris` - Asset items
- `PermohonanAset` - Loan requests

**Keuangan:**
- `RiwayatKeuangan` - Transaction history
- `RekapKeuangan` - Monthly summary

**Key Features:**
- ✅ Permohonan pengadaan aset dengan wishlist
- ✅ Approval workflow for loans
- ✅ Auto-update stok on approval
- ✅ Auto-generate monthly recap
- ✅ Multiple payment methods tracking

**Business Logic:**
- Stok auto-decreased when loan approved
- RekapKeuangan updates via observer pattern
- Saldo = total_pemasukan - total_pengeluaran

---

### 🎯 4. CLASS_04_KEGIATAN_PROKER_PIKET.puml
**Domain:** Activities & Scheduling  
**Jumlah Classes:** 9

**Program Kerja & Kegiatan:**
- `Proker` - Annual work program
- `Kegiatan` - Activities/events
- `KegiatanPeserta` - Participant tracking
- `SertifikatTemplate` - Certificate templates

**Piket:**
- `PeriodePiket` - Shift periods
- `JadwalPiket` - Shift schedules
- `GantiJadwalPiket` - Swap requests
- `AbsensiAslab` - Shift attendance

**Key Features:**
- ✅ Approval workflow (diajukan → disetujui)
- ✅ Dual certificate types (peserta vs panitia)
- ✅ Shift swap request/approval
- ✅ Check-in/check-out system
- ✅ LPJ upload tracking

**Status Flow:**
- **Kegiatan:** diajukan → disetujui/ditolak → selesai
- **Proker:** belum_mulai → berjalan → selesai

---

### ✉️ 5. CLASS_05_SURAT_SERTIFIKAT.puml
**Domain:** Communication  
**Jumlah Classes:** 2

**Classes:**
- `Surat` - Inter-lab correspondence
- `Sertifikat` - Achievement certificates

**Key Features:**
- ✅ Auto-generate nomor surat/sertifikat
- ✅ Attachment support for surat
- ✅ Read status tracking
- ✅ Public certificate validation
- ✅ Two certificate types (praktikum, kepengurusan)

**Business Logic:**
- Nomor Surat: `{lab_code}/SRT/{seq}/{month}/{year}`
- Nomor Sertifikat: `SERT/{lab}/{year}/{seq}`
- Static validation method for public access

---

## 📊 Statistik Total

| Kategori | Jumlah |
|:---------|:------:|
| **Total Class Diagrams** | 6 |
| **Total Classes** | 40+ |
| **Total Relationships** | 60+ |
| **Total Attributes** | 200+ |
| **Total Methods** | 100+ |

---

## 🎨 Konvensi Diagram

### Visibility Modifiers
```
+ public
# protected
- private
```

### Attribute Format
```
+ attribute_name : data_type
# id : bigint {PK}
+ email : string {unique}
+ user_id : bigint {FK}
```

### Method Format
```
+ methodName(param : type) : returnType
+ hasRole(role : string) : bool
{static} + staticMethod() : void
```

### Relationship Notation
```
"1" -- "*"      : One to Many
"*" -- "*"      : Many to Many
"1" -- "0..1"   : One to Optional One
"1" -- "1"      : One to One
```

### Stereotype Usage
```
<<junction>>    : Junction table (pivot)
<<abstract>>    : Abstract class
<<interface>>   : Interface
<<service>>     : Service class
```

---

## 🔍 Design Patterns Teridentifikasi

### 1. Multi-Tenancy Pattern
**Class:** `KepengurusanLab`  
**Pattern:** Scoped queries via `is_active`  
**Purpose:** Isolate data by management period

### 2. Observer Pattern
**Classes:** `RiwayatKeuangan` → `RekapKeuangan`  
**Pattern:** Auto-update summary on transaction create/update/delete  
**Implementation:** Laravel Model Events

### 3. Strategy Pattern
**Classes:** `RubrikPenilaian` vs Manual Grading  
**Pattern:** Multiple grading strategies  
**Purpose:** Flexible assessment methods

### 4. Approval Workflow Pattern
**Classes:** `PermohonanAset`, `GantiJadwalPiket`, `Kegiatan`  
**Pattern:** Status-based state machine  
**States:** pending → approved/rejected

### 5. Polymorphic Relations
**Classes:** `ModelHasRoles`, `ModelHasPermissions`  
**Pattern:** Spatie Permission polymorphic tables  
**Purpose:** Flexible role/permission assignment

---

## 🚀 Cara Menggunakan

### 1. Render dengan PlantUML CLI
```bash
# Install
npm install -g node-plantuml

# Generate specific diagram
plantuml CLASS_01_CORE_AUTH.puml

# Generate all class diagrams
plantuml CLASS_*.puml

# Generate as SVG (scalable)
plantuml -tsvg CLASS_02_PRAKTIKUM.puml
```

### 2. VS Code Extension
1. Install "PlantUML" extension
2. Open `.puml` file
3. Press `Alt+D` for preview
4. Right-click → Export

### 3. Online Editor
- Visit: https://www.plantuml.com/plantuml/uml/
- Paste diagram code
- Click "Submit"

---

## 💡 Insights Arsitektur

### Security Model (Hybrid)
```
RBAC (Role-Based)
  ↓
User → Role → Permissions
  ↓
PBAC (Position-Based)
  ↓
Anggota → Struktur → StrukturPermissions
  ↓
CBAC (Context-Based)
  ↓
Middleware: active.kepengurusan
```

### Multi-Tenancy Strategy
```
Laboratorium (Lab)
  ↓
TahunKepengurusan (Year)
  ↓
KepengurusanLab (Active Period)
  ↓
All operational data scoped here
(Praktikum, Inventaris, Keuangan, etc.)
```

### Data Ownership Chain
```
User
  ↓ member of
Anggota
  ↓ belongs to
KepengurusanLab
  ↓ context for
All Module Data
```

---

## 📝 Catatan Implementasi

### Eloquent Relationships
Semua relasi menggunakan Laravel Eloquent:
- `hasMany()` - One to Many
- `belongsTo()` - Inverse of hasMany
- `belongsToMany()` - Many to Many
- `hasOne()` - One to One

### Model Conventions
```php
// Timestamps
public $timestamps = true; // created_at, updated_at

// Soft Deletes (recommended for critical data)
use SoftDeletes;

// Fillable (mass assignment protection)
protected $fillable = [...];

// Casts
protected $casts = [
    'is_active' => 'boolean',
    'tanggal' => 'date',
];
```

### Validation Rules
Lihat sequence diagrams untuk validation rules detail di setiap endpoint.

---

## 🔄 Update Diagram

Jika ada perubahan pada Model:
1. Identifikasi diagram yang terpengaruh
2. Update attributes/methods/relations
3. Re-generate diagram
4. Update dokumentasi ini jika ada model baru

---

## 📚 Referensi

**Related Diagrams:**
- [Use Case Diagram](PLANTUML_USECASE_DIAGRAM.puml)
- [ER Diagram](PLANTUML_ER_DIAGRAM.puml)
- [Sequence Diagrams](README_SEQUENCE_DIAGRAMS.md)

**Laravel Documentation:**
- [Eloquent Relationships](https://laravel.com/docs/eloquent-relationships)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)

---

**Created by:** AI Assistant  
**Last Updated:** 2026-02-10  
**Version:** 1.0.0  
**Total Models:** 40+
