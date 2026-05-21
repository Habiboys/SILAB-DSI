# Katalog Use Case UAT (Sinkron dari File .puml Terbaru)

Sumber tunggal sinkronisasi:
- `docs/auth/usecase/UC_AUTH.puml`
- `docs/inventaris/usecase/UC_INVENTARIS.puml`
- `docs/keuangan/usecase/UC_KEUANGAN.puml`
- `docs/praktikum/usecase/UC_PRAKTIKUM.puml`
- `docs/kegiatan_proker/usecase/UC_KEGIATAN_PROKER.puml`
- `docs/piket/usecase/UC_PIKET.puml`
- `docs/surat/usecase/UC_SURAT.puml`
- `docs/kuesioner/usecase/UC_KUESIONER.puml`

## Matrix Final Role -> Use Case (Untuk UAT)

## Admin
- Auth: `AUTH-UC04`, `AUTH-UC05`, `AUTH-UC06`, `AUTH-UC07`
- Praktikum: `PRAK-UC01`, `UC02`, `UC03`, `UC04`, `UC06`, `UC07`, `UC08`, `UC09`, `UC10`, `UC12`, `UC13`, `UC17`, `UC18`, `UC19`, `UC20`, `UC21`, `UC22`, `UC23`
- Inventaris: `INV-UC01`, `INV-UC02`, `INV-UC04`, `INV-UC05`, `INV-UC06`, `INV-UC09`
- Keuangan: `KEU-UC01`, `KEU-UC02`, `KEU-UC03`, `KEU-UC04`, `KEU-UC05`
- Kegiatan/Proker: `KEG-UC01`, `UC02`, `UC04`, `UC05`, `UC06`, `UC07`, `UC08`, `UC09`, `UC11`, `UC12`, `UC13`
- Piket: `PIK-UC01`, `UC02`, `UC03`, `UC05`, `UC06`
- Surat: `SUR-UC01`, `UC02`, `UC03`, `UC04`, `UC05`, `UC06`
- Kuesioner: `KUES-UC01`, `KUES-UC03`

## Asisten
- Auth: `AUTH-UC04`, `AUTH-UC05`, `AUTH-UC06`, `AUTH-UC07`
- Praktikum: `PRAK-UC02`, `UC03`, `UC04`, `UC06`, `UC08`, `UC09`, `UC10`, `UC12`, `UC13`, `UC17`, `UC18`, `UC19`, `UC20`, `UC21`, `UC22`, `UC23`
- Inventaris: `INV-UC02`, `INV-UC03`, `INV-UC05`, `INV-UC07`, `INV-UC10`
- Keuangan: `KEU-UC03`, `KEU-UC05`
- Kegiatan/Proker: `KEG-UC01`, `UC02`, `UC04`, `UC07`, `UC08`, `UC11`, `UC14`
- Piket: `PIK-UC03` (Mengambil Absen Piket), `PIK-UC04`, `PIK-UC06`, `PIK-UC07`
- Surat: `SUR-UC01`, `UC02`, `UC03`, `UC04`, `UC05*`
- Kuesioner: `KUES-UC02`

`*` SUR-UC05 hanya untuk Asisten berjabatan Sekretaris (sesuai catatan pada diagram).

## Catatan Sinkronisasi
- Dokumen ini mengikuti relasi aktor pada `.puml` (termasuk generalisasi aktor).
- Untuk kebutuhan UAT berbasis use case: case modul diprioritaskan sebagai Functional Suitability.
