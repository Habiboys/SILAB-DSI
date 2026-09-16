<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->

<!-- silab-ui:start -->
## SILAB UI Conventions (DaisyUI 5)

Wajib dibaca saat membuat/mengubah halaman React (`resources/js`).

### Komponen bersama, bukan markup mentah
- Tombol: `Button` (`variant`: primary/secondary/ghost/outline/danger/success/warning; `loading`, `href`). Jangan tulis `btn btn-*` manual di Pages.
- Input form: bungkus dengan `FormField` (label + error + hint). Input/select: class `input`/`select` + `min-h-11 w-full` — TANPA `-bordered` (kelas DaisyUI 4, sudah mati di v5).
- Modal: `Modal` (native `<dialog>`); konfirmasi hapus/aksi: `ConfirmModal`; konfirmasi imperatif: `await confirmDialog({...})` dari `@/Components/confirmDialog`. Dilarang `window.confirm`/`alert` — pakai `confirmDialog` + `toast` (sonner).
- Drawer: `Drawer` (portal, Esc, backdrop) — acuan pemakaian: `Components/AsetDrawer.jsx`.
- Tabel list CRUD: `DataGrid` (klien) / `ServerDataTable` (paginator Inertia) dari `Components/DataTable.jsx` dengan kontrak kolom `{ key, header, sortable, filter, render(row, index), className, cellClassName }`. Tabel matriks dinamis: bungkus `<DataTable>` (frame+thead styling otomatis).
- Badge status: `StatusBadge` / `Badge`. Empty state: `EmptyState`. Header halaman: `PageHeader` + `PageSection`.

### Styling
- Warna HANYA token DaisyUI (`primary`, `secondary`, `success`, `error`, `warning`, `info`, `neutral`, `base-*` + opacity `/10`). Dilarang palet Tailwind mentah (`bg-blue-600`, `text-gray-700`, ...).
- Tab: `tabs tabs-box` (bukan `tabs-boxed`). Icon: `lucide-react` saja. Loading list: skeleton (`silab-table-skeleton`); spinner hanya di tombol.
- Spacing form diatur container (`space-y-4`); `fieldset-legend` sudah dinormalisasi di `app.css` — jangan tambah padding legend manual.

### Kebersihan
- Tidak ada `console.log` di commit. Satu file satu tanggung jawab; halaman >800 baris dipecah ke `Partials/`.

Konvensi kolom tabel mengikuti repo acuan: Akademik-Unand/MyUNAND-Akademik (frontend-conventions).
<!-- silab-ui:end -->
