<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TahunKepengurusanController;
use App\Http\Controllers\KepengurusanLabController;
use App\Http\Controllers\StrukturController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\RiwayatKeuanganController;
use App\Http\Controllers\RekapKeuanganController;
use App\Http\Controllers\CatatanKasController;
use App\Http\Controllers\PraktikumController;
use App\Http\Controllers\ModulPraktikumController;
use App\Http\Controllers\SuratController;
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\JadwalPiketController;
use App\Http\Controllers\PeriodePiketController;
use App\Http\Controllers\GantiJadwalPiketController;
use App\Http\Controllers\InventarisController;
use App\Http\Controllers\DetailInventarisController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KategoriAsetController;
use App\Http\Controllers\PermohonanAsetController;
use App\Http\Controllers\PeminjamanAsetController;

use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

// use Spatie\Permission\Middlewares\PermissionMiddleware;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ProkerController;
use Spatie\Permission\Middlewares\RoleMiddleware;

// Public routes (no auth required)
Route::get('modul/{hash}', [ModulPraktikumController::class, 'viewPublic'])
    ->name('modul.public.view');

// Public asset detail page (accessible via QR code scan, no auth required)
Route::get('aset/{id}/detail', [DetailInventarisController::class, 'publicDetail'])
    ->name('aset.public-detail');

// Public certificate verification (accessible via QR scan, no auth required)
Route::get('/verify/{nomor}', [App\Http\Controllers\SertifikatVerifikasiController::class, 'show'])
    ->name('sertifikat.verify')
    ->where('nomor', '.+');

Route::get('/debug-auth', function() {
    $user = auth()->user();
    if(!$user) return 'Not logged in';
    return [
        'id' => $user->id,
        'name' => $user->name,
        'roles' => $user->getRoleNames(),
        'permissions' => $user->getAllPermissions()->pluck('name'),
        'current_lab' => $user->getCurrentLab(),
    ];
});

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();

        // Priority 1: If user has access to a specific lab (Admin/Laboran) or has active kepengurusan (Aslab/Pengurus)
        // They should go to dashboard.
        $currentLab = $user->getCurrentLab();
        if ($currentLab) {
             return redirect()->route('dashboard');
        }

        // Cek jika dia punya role asisten, admin, dll
        if ($user->hasAnyRole(['superadmin', 'kadep', 'admin', 'kalab', 'asisten', 'dosen'])) {
             return redirect()->route('dashboard');
        }

        // Priority 2: If user is JUST a praktikan, go to student page
        if ($user->hasRole('praktikan')) {
            return redirect()->route('praktikan.daftar-tugas');
        }

        // Fallback
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('home');

Route::middleware([
    'auth:sanctum',
    \App\Http\Middleware\CheckLabAccess::class,
    // config('jetstream.auth_middleware', 'verified'), // Commented out to disable email verification
])->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('/about', [App\Http\Controllers\AboutController::class, 'index'])->name('about');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    //modul kepengurusan - with policy authorization
    Route::post('/anggota/transfer-from-previous', [AnggotaController::class, 'transferFromPrevious'])
        ->name('anggota.transfer-from-previous')
        ->can('transfer', \App\Models\KepengurusanUser::class);
    Route::get('/anggota/active-members-from-previous', [AnggotaController::class, 'getActiveMembersFromPrevious'])
        ->name('anggota.active-members-from-previous');
    Route::resource('anggota', AnggotaController::class);
    Route::resource('tahun-kepengurusan', TahunKepengurusanController::class);
    Route::resource('kepengurusan-lab', KepengurusanLabController::class);

    // Proker - with policy authorization
    Route::get('/kegiatan/kalender', [App\Http\Controllers\KegiatanController::class, 'calendarView'])->name('kegiatan.calendar-view');
    Route::get('/kegiatan/calendar-data', [App\Http\Controllers\KegiatanController::class, 'calendar'])->name('kegiatan.calendar-data');
    Route::post('/kegiatan/{kegiatan}/approve', [App\Http\Controllers\KegiatanController::class, 'approve'])->name('kegiatan.approve');

    // Laporan Kegiatan
    Route::post('/kegiatan/{kegiatan}/laporan', [App\Http\Controllers\LaporanKegiatanController::class, 'store'])->name('laporan-kegiatan.store');
    Route::delete('/laporan-kegiatan/{laporan}', [App\Http\Controllers\LaporanKegiatanController::class, 'destroy'])->name('laporan-kegiatan.destroy');
    Route::get('/laporan-kegiatan/{laporan}/download', [App\Http\Controllers\LaporanKegiatanController::class, 'download'])->name('laporan-kegiatan.download');

    // Kegiatan Peserta
    Route::get('/kegiatan/{kegiatan}/peserta', [App\Http\Controllers\KegiatanController::class, 'indexPeserta'])->name('kegiatan.peserta.index');
    Route::post('/kegiatan/{kegiatan}/peserta', [App\Http\Controllers\KegiatanController::class, 'storePeserta'])->name('kegiatan.peserta.store');
    Route::delete('/kegiatan/{kegiatan}/peserta/{pesertaId}', [App\Http\Controllers\KegiatanController::class, 'destroyPeserta'])->name('kegiatan.peserta.destroy');

    // Sertifikat Kegiatan (dedicated page)
    Route::get('/kegiatan/{kegiatan}/sertifikat', [App\Http\Controllers\KegiatanController::class, 'sertifikat'])->name('kegiatan.sertifikat');
    Route::post('/kegiatan/{kegiatan}/template', [App\Http\Controllers\KegiatanController::class, 'uploadTemplate'])->name('kegiatan.template.upload');
    Route::post('/kegiatan/{kegiatan}/generate-sertifikat', [App\Http\Controllers\KegiatanController::class, 'generateCertificates'])->name('kegiatan.sertifikat.generate');

    // Dokumentasi Kegiatan
    Route::post('/kegiatan/{kegiatan}/dokumentasi', [App\Http\Controllers\DokumentasiKegiatanController::class, 'store'])->name('dokumentasi-kegiatan.store');
    Route::delete('/dokumentasi-kegiatan/{dokumentasi}', [App\Http\Controllers\DokumentasiKegiatanController::class, 'destroy'])->name('dokumentasi-kegiatan.destroy');
    Route::get('/dokumentasi-kegiatan/{dokumentasi}/download', [App\Http\Controllers\DokumentasiKegiatanController::class, 'download'])->name('dokumentasi-kegiatan.download');

    Route::resource('kegiatan', App\Http\Controllers\KegiatanController::class);

    Route::get('/proker', [ProkerController::class, 'index'])->name('proker.index')
        ->can('viewAny', \App\Models\Proker::class);
    Route::get('/proker/{proker}', [ProkerController::class, 'show'])->name('proker.show')
        ->can('view', 'proker');

    // Dokumentasi proker download (no active.kepengurusan needed – read only)
    Route::get('/proker-dokumentasi/{dokumentasi}/download', [App\Http\Controllers\ProkerDokumentasiController::class, 'download'])
        ->name('proker-dokumentasi.download');

    // Manipulation proker - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:proker'])->group(function () {
        Route::post('/proker', [ProkerController::class, 'store'])->name('proker.store')
            ->can('create', \App\Models\Proker::class);
        Route::put('/proker/{proker}', [ProkerController::class, 'update'])->name('proker.update')
            ->can('update', 'proker');
        Route::delete('/proker/{proker}', [ProkerController::class, 'destroy'])->name('proker.destroy')
            ->can('delete', 'proker');

        // Approval workflow
        Route::post('/proker/{proker}/ajukan', [ProkerController::class, 'ajukan'])->name('proker.ajukan');
        Route::post('/proker/{proker}/approve', [ProkerController::class, 'approve'])->name('proker.approve');

        // Evaluasi (kendala/solusi/saran)
        Route::patch('/proker/{proker}/evaluasi', [ProkerController::class, 'saveEvaluasi'])->name('proker.evaluasi');

        // Penanggung Jawab
        Route::post('/proker/{proker}/pj', [ProkerController::class, 'addPj'])->name('proker-pj.store');
        Route::delete('/proker/{proker}/pj/{pj}', [ProkerController::class, 'removePj'])->name('proker-pj.destroy');

        // Parameter Penilaian
        Route::post('/proker/{proker}/parameter', [App\Http\Controllers\ProkerParameterController::class, 'store'])->name('proker-parameter.store');
        Route::put('/proker-parameter/{parameter}', [App\Http\Controllers\ProkerParameterController::class, 'update'])->name('proker-parameter.update');
        Route::delete('/proker-parameter/{parameter}', [App\Http\Controllers\ProkerParameterController::class, 'destroy'])->name('proker-parameter.destroy');
        Route::patch('/proker-parameter/{parameter}/capaian', [App\Http\Controllers\ProkerParameterController::class, 'updateCapaian'])->name('proker-parameter.capaian');

        // Dokumentasi
        Route::post('/proker/{proker}/dokumentasi', [App\Http\Controllers\ProkerDokumentasiController::class, 'store'])->name('proker-dokumentasi.store');
        Route::delete('/proker-dokumentasi/{dokumentasi}', [App\Http\Controllers\ProkerDokumentasiController::class, 'destroy'])->name('proker-dokumentasi.destroy');
    });
    //modul keuangan - view bisa akses semua, manipulation hanya kepengurusan aktif
    Route::get('/riwayat-keuangan', [RiwayatKeuanganController::class, 'index'])->name('riwayat-keuangan.index');
    Route::get('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'show'])->name('riwayat-keuangan.show');
    Route::get('/riwayat-keuangan/export', [RiwayatKeuanganController::class, 'export'])->name('riwayat-keuangan.export');
    Route::get('/riwayat-keuangan/check-data', [RiwayatKeuanganController::class, 'checkData'])->name('riwayat-keuangan.check-data');
    Route::get('/catatan-kas', [RiwayatKeuanganController::class, 'catatanKas'])->name('catatan-kas');
    Route::get('/rekap-keuangan', [RekapKeuanganController::class, 'index'])->name('rekap-keuangan.index');
    // Manipulation keuangan - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:keuangan'])->group(function () {
        Route::post('/riwayat-keuangan', [RiwayatKeuanganController::class, 'store'])->name('riwayat-keuangan.store');
        Route::put('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'update'])->name('riwayat-keuangan.update');
        Route::delete('/riwayat-keuangan/{riwayatKeuangan}', [RiwayatKeuanganController::class, 'destroy'])->name('riwayat-keuangan.destroy');

        // Routes untuk nominal kas
        Route::post('/nominal-kas', [RiwayatKeuanganController::class, 'storeNominalKas'])->name('nominal-kas.store');
        Route::put('/nominal-kas/{nominalKas}', [RiwayatKeuanganController::class, 'updateNominalKas'])->name('nominal-kas.update');
        Route::delete('/nominal-kas/{nominalKas}', [RiwayatKeuanganController::class, 'destroyNominalKas'])->name('nominal-kas.destroy');
        Route::put('/nominal-kas/{nominalKas}/toggle-active', [RiwayatKeuanganController::class, 'toggleActiveNominalKas'])->name('nominal-kas.toggle-active');
    });

    //modul praktikum - with policy authorization
    Route::get('/praktikum', [PraktikumController::class, 'index'])->name('praktikum.index')
        ->can('viewAny', \App\Models\Praktikum::class);
    Route::get('/praktikum/{praktikum}', [PraktikumController::class, 'show'])->name('praktikum.show')
        ->can('view', 'praktikum');
    Route::get('praktikum/{praktikum}/modul', [ModulPraktikumController::class, 'index'])->name('praktikum.modul.index')
        ->can('view', 'praktikum');
    Route::get('praktikum/{praktikum}/modul/{modul}/view/{filename?}', [ModulPraktikumController::class, 'view'])
        ->name('praktikum.modul.view')
        ->where('filename', '.*')
        ->can('view', 'modul');

    Route::post('praktikum/{praktikum}/modul/{modul}/toggle-share', [ModulPraktikumController::class, 'toggleShareLink'])
        ->name('praktikum.modul.toggle-share');

    // Manipulation praktikum - hanya kepengurusan aktif
    Route::middleware(['active.kepengurusan:praktikum'])->group(function () {
        Route::post('/praktikum', [PraktikumController::class, 'store'])->name('praktikum.store')
            ->can('create', \App\Models\Praktikum::class);
        Route::put('/praktikum/{praktikum}', [PraktikumController::class, 'update'])->name('praktikum.update')
            ->can('update', 'praktikum');
        Route::delete('/praktikum/{praktikum}', [PraktikumController::class, 'destroy'])->name('praktikum.destroy')
            ->can('delete', 'praktikum');
        //Pertemuan dan file modul praktikum
        Route::resource('praktikum.modul', ModulPraktikumController::class)->only(['store', 'update', 'destroy']);

        // Praktikan Management
        Route::get('praktikum/{praktikum}/praktikan', [App\Http\Controllers\PraktikanController::class, 'index'])->name('praktikum.praktikan.index');
        Route::post('praktikum/{praktikum}/praktikan', [App\Http\Controllers\PraktikanController::class, 'store'])->name('praktikum.praktikan.store');
        Route::post('praktikum/{praktikum}/praktikan/add-existing', [App\Http\Controllers\PraktikanController::class, 'addExistingUser'])->name('praktikum.praktikan.add-existing');
        Route::post('praktikum/{praktikum}/praktikan/import', [App\Http\Controllers\PraktikanController::class, 'import'])->name('praktikum.praktikan.import');
        Route::put('praktikum/{praktikum}/praktikan/{praktikan}', [App\Http\Controllers\PraktikanController::class, 'update'])->name('praktikum.praktikan.update');
        Route::put('praktikum/{praktikum}/praktikan/{praktikan}/assign-kelas', [App\Http\Controllers\PraktikanController::class, 'assignToKelas'])->name('praktikum.praktikan.assign-kelas');
        Route::put('praktikum/{praktikum}/praktikan/{praktikan}/remove-kelas', [App\Http\Controllers\PraktikanController::class, 'removeFromKelas'])->name('praktikum.praktikan.remove-kelas');
        Route::put('praktikum/praktikan/{praktikan}/status', [App\Http\Controllers\PraktikanController::class, 'updateStatus'])->name('praktikum.praktikan.update-status');
        Route::delete('praktikum/praktikan/{praktikan}', [App\Http\Controllers\PraktikanController::class, 'destroy'])->name('praktikum.praktikan.destroy');

        //Pertemuan dan file modul praktikum
        Route::resource('praktikum.modul', ModulPraktikumController::class)->only(['store', 'update', 'destroy']);

        // Tugas Praktikum Management
        Route::get('praktikum/{praktikum}/tugas', [App\Http\Controllers\TugasPraktikumController::class, 'index'])->name('praktikum.tugas.index');
        Route::post('praktikum/{praktikum}/tugas', [App\Http\Controllers\TugasPraktikumController::class, 'store'])->name('praktikum.tugas.store');
        Route::put('praktikum/tugas/{tugas}', [App\Http\Controllers\TugasPraktikumController::class, 'update'])->name('praktikum.tugas.update');
        Route::delete('praktikum/tugas/{tugas}', [App\Http\Controllers\TugasPraktikumController::class, 'destroy'])->name('praktikum.tugas.destroy');
        Route::get('praktikum/tugas/{tugas}/download', [App\Http\Controllers\TugasPraktikumController::class, 'downloadFile'])->name('praktikum.tugas.download');
        Route::get('praktikum/tugas/{tugas}/view', [App\Http\Controllers\TugasPraktikumController::class, 'viewFile'])->name('praktikum.tugas.view');

        // Pengumpulan Tugas Management (untuk admin)
        Route::get('praktikum/tugas/{tugas}/pengumpulan', [App\Http\Controllers\PengumpulanTugasController::class, 'index'])->name('praktikum.tugas.pengumpulan.index');
        Route::put('praktikum/pengumpulan/{pengumpulan}', [App\Http\Controllers\PengumpulanTugasController::class, 'update'])->name('praktikum.pengumpulan.update');
        Route::delete('praktikum/pengumpulan/{pengumpulan}', [App\Http\Controllers\PengumpulanTugasController::class, 'destroy'])->name('praktikum.pengumpulan.destroy');
        Route::get('praktikum/pengumpulan/{pengumpulan}/download', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFile'])->name('praktikum.pengumpulan.download');

        // Admin melihat tugas yang dikumpulkan
        Route::get('praktikum/tugas/{tugas}/submissions', [App\Http\Controllers\PengumpulanTugasController::class, 'adminSubmissions'])->name('praktikum.tugas.submissions');
        Route::get('praktikum/tugas/{tugas}/export-grades', [App\Http\Controllers\PengumpulanTugasController::class, 'exportGrades'])->name('praktikum.tugas.export-grades');
        Route::get('praktikum/{praktikum}/export-grades', [App\Http\Controllers\PengumpulanTugasController::class, 'exportMultipleGrades'])->name('praktikum.export-grades');

        // Import/Export Nilai
        Route::get('praktikum/{praktikum}/tugas/{tugas}/download-nilai-template', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadNilaiTemplate'])->name('praktikum.tugas.download-nilai-template');
        Route::post('praktikum/{praktikum}/tugas/{tugas}/import-nilai', [App\Http\Controllers\PengumpulanTugasController::class, 'importNilai'])->name('praktikum.tugas.import-nilai');
        Route::put('praktikum/submission/{pengumpulan}/grade', [App\Http\Controllers\PengumpulanTugasController::class, 'gradeSubmission'])->name('praktikum.submission.grade');
        Route::post('praktikum/submission/rubrik-grade', [App\Http\Controllers\PengumpulanTugasController::class, 'storeNilaiRubrik'])->name('praktikum.submission.rubrik-grade');
        Route::post('praktikum/submission/matrix-grade', [App\Http\Controllers\PengumpulanTugasController::class, 'storeMatrixNilaiRubrik'])->name('praktikum.submission.matrix-grade');
        Route::put('praktikum/submission/{pengumpulan}/reject', [App\Http\Controllers\PengumpulanTugasController::class, 'rejectSubmission'])->name('praktikum.submission.reject');
        Route::get('praktikum/pengumpulan/download/{filename}', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFileByFilename'])->name('praktikum.pengumpulan.download.filename');

        // Komponen Rubrik Management (Simplified)
        Route::get('praktikum/tugas/{tugas}/komponen', [App\Http\Controllers\KomponenRubrikController::class, 'index'])->name('praktikum.tugas.komponen.index');
        Route::post('praktikum/tugas/{tugas}/komponen', [App\Http\Controllers\KomponenRubrikController::class, 'store'])->name('praktikum.tugas.komponen.store');
        Route::put('praktikum/tugas/{tugas}/komponen/{komponen}', [App\Http\Controllers\KomponenRubrikController::class, 'update'])->name('praktikum.tugas.komponen.update');
        Route::delete('praktikum/tugas/{tugas}/komponen/{komponen}', [App\Http\Controllers\KomponenRubrikController::class, 'destroy'])->name('praktikum.tugas.komponen.destroy');
        Route::put('praktikum/tugas/{tugas}/komponen-urutan', [App\Http\Controllers\KomponenRubrikController::class, 'updateUrutan'])->name('praktikum.tugas.komponen.update-urutan');

        // Nilai Tambahan
        Route::post('praktikum/tugas/{tugas}/nilai-tambahan', [App\Http\Controllers\KomponenRubrikController::class, 'storeNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.store');
        Route::get('praktikum/tugas/{tugas}/praktikan/{praktikan}/nilai-tambahan', [App\Http\Controllers\KomponenRubrikController::class, 'getNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.get');
        Route::put('praktikum/tugas/{tugas}/nilai-tambahan/{nilai}', [App\Http\Controllers\KomponenRubrikController::class, 'updateNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.update');
        Route::delete('praktikum/tugas/{tugas}/nilai-tambahan/{nilai}', [App\Http\Controllers\KomponenRubrikController::class, 'deleteNilaiTambahan'])->name('praktikum.tugas.nilai-tambahan.delete');

        // Aslab Management
        Route::get('praktikum/{praktikum}/aslab', [App\Http\Controllers\AslabPraktikumController::class, 'index'])->name('praktikum.aslab.index');
        Route::post('praktikum/{praktikum}/aslab', [App\Http\Controllers\AslabPraktikumController::class, 'store'])->name('praktikum.aslab.store');
        Route::delete('praktikum/{praktikum}/aslab/{aslab}', [App\Http\Controllers\AslabPraktikumController::class, 'destroy'])->name('praktikum.aslab.destroy');

        // Pertemuan Praktikum Management
        Route::get('praktikum/{praktikum}/pertemuan', [App\Http\Controllers\PertemuanPraktikumController::class, 'index'])->name('praktikum.pertemuan.index');
        Route::post('praktikum/{praktikum}/pertemuan', [App\Http\Controllers\PertemuanPraktikumController::class, 'store'])->name('praktikum.pertemuan.store');
        Route::put('praktikum/pertemuan/{pertemuan}', [App\Http\Controllers\PertemuanPraktikumController::class, 'update'])->name('praktikum.pertemuan.update');
        Route::delete('praktikum/pertemuan/{pertemuan}', [App\Http\Controllers\PertemuanPraktikumController::class, 'destroy'])->name('praktikum.pertemuan.destroy');

        // Absensi Praktikum Management
        Route::get('praktikum/pertemuan/{pertemuan}/absensi', [App\Http\Controllers\PraktikumAbsensiController::class, 'index'])->name('praktikum.absensi.index');
        Route::post('praktikum/pertemuan/{pertemuan}/absensi-praktikan', [App\Http\Controllers\PraktikumAbsensiController::class, 'storePraktikan'])->name('praktikum.absensi.praktikan.store');
        Route::post('praktikum/pertemuan/{pertemuan}/absensi-aslab', [App\Http\Controllers\PraktikumAbsensiController::class, 'storeAslab'])->name('praktikum.absensi.aslab.store');

        // Export Absensi
        Route::get('praktikum/{praktikum}/absensi/export-praktikan/{kelasId}', [App\Http\Controllers\PertemuanPraktikumController::class, 'exportPraktikan'])->name('praktikum.absensi.export-praktikan');
        Route::get('praktikum/{praktikum}/absensi/export-aslab/{kelasId}', [App\Http\Controllers\PertemuanPraktikumController::class, 'exportAslab'])->name('praktikum.absensi.export-aslab');

        // Sertifikat Praktikum Management
        Route::get('praktikum/{praktikum}/sertifikat', [App\Http\Controllers\PraktikumSertifikatController::class, 'index'])->name('praktikum.sertifikat.index');
        Route::post('praktikum/{praktikum}/sertifikat/template', [App\Http\Controllers\PraktikumSertifikatController::class, 'uploadTemplate'])->name('praktikum.sertifikat.template');
        Route::post('praktikum/{praktikum}/sertifikat/generate', [App\Http\Controllers\PraktikumSertifikatController::class, 'generate'])->name('praktikum.sertifikat.generate');
    });

    // Praktikan Routes (untuk praktikan yang sudah login)
    Route::middleware(['auth', 'role:praktikan'])->group(function () {
        Route::get('/praktikan/daftar-tugas', [App\Http\Controllers\PraktikanController::class, 'daftarTugas'])->name('praktikan.daftar-tugas');
        Route::get('/praktikan/tugas/{tugas}', [App\Http\Controllers\PraktikanController::class, 'detailTugas'])->name('praktikan.tugas.show');
        Route::get('/praktikan/praktikum/{praktikum}/tugas', [App\Http\Controllers\PraktikanController::class, 'praktikumTugas'])->name('praktikan.praktikum.tugas');
        Route::get('/praktikan/riwayat-tugas', [App\Http\Controllers\PraktikanController::class, 'riwayatTugas'])->name('praktikan.riwayat');
        Route::get('/praktikan/riwayat-tugas/{pengumpulan}', [App\Http\Controllers\PraktikanController::class, 'detailRiwayatTugas'])->name('praktikan.riwayat.show');

        // Pengumpulan tugas
        Route::post('/praktikum/tugas/{tugas}/pengumpulan', [App\Http\Controllers\PengumpulanTugasController::class, 'store'])->name('praktikum.tugas.pengumpulan.store');
        Route::delete('/praktikum/pengumpulan/{pengumpulan}/cancel', [App\Http\Controllers\PengumpulanTugasController::class, 'cancelSubmission'])->name('praktikum.pengumpulan.cancel');

        // Student Module Dashboard
        Route::get('/praktikan/modul', [App\Http\Controllers\ModulPraktikumController::class, 'studentIndex'])->name('praktikan.modul.index');
    });

    // Route untuk download file (bisa diakses semua user yang sudah login)
    Route::middleware(['auth'])->group(function () {
        Route::get('/praktikum/pengumpulan/download/{filename}', [App\Http\Controllers\PengumpulanTugasController::class, 'downloadFileByFilename'])->name('praktikum.pengumpulan.download.filename');
    });


    // Template download route (public)
    Route::get('/praktikan/template-download', [App\Http\Controllers\PraktikanController::class, 'downloadTemplate'])->name('praktikan.template.download');
    Route::get('kepengurusan-lab/{kepengurusanLab}/download-sk', [KepengurusanLabController::class, 'downloadSk'])
        ->name('kepengurusan-lab.download-sk');


    // User Certificates
    Route::get('/sertifikat-saya', [App\Http\Controllers\SertifikatController::class, 'index'])->name('sertifikat.index');
    Route::get('/sertifikat-saya/{sertifikat}/download', [App\Http\Controllers\SertifikatController::class, 'download'])->name('sertifikat.download');

    // API untuk cek status kepengurusan
    Route::get('/api/check-kepengurusan-status', function (Request $request) {
        $lab_id = $request->input('lab_id');
        $modul = $request->input('modul');

        if (!$lab_id) {
            return response()->json(['error' => 'Lab ID tidak ditemukan'], 400);
        }

        $hasActiveKepengurusan = \App\Helpers\KepengurusanHelper::hasActiveKepengurusan($lab_id);
        $canAccessModul = $hasActiveKepengurusan ? \App\Helpers\KepengurusanHelper::canAccessModul($lab_id, $modul) : false;

        return response()->json([
            'has_active_kepengurusan' => $hasActiveKepengurusan,
            'can_access_modul' => $canAccessModul,
            'message' => \App\Helpers\KepengurusanHelper::getModulAccessMessage($lab_id, $modul)
        ]);
    })->name('api.check-kepengurusan-status');

    //Inventaris - with policy authorization
    Route::get('inventaris', [InventarisController::class, 'index'])->name('inventaris.index')
        ->can('viewAny', \App\Models\Inventaris::class);
    Route::get('inventaris/export-excel', [InventarisController::class, 'exportExcel'])->name('inventaris.export-excel');
    Route::resource('inventaris/permohonan', PermohonanAsetController::class)->names('inventaris.permohonan');
    Route::post('inventaris/permohonan/{permohonan}/approve', [PermohonanAsetController::class, 'approve'])
        ->name('inventaris.permohonan.approve')
        ->can('approve', 'permohonan');
    Route::post('inventaris/permohonan/{permohonan}/reject', [PermohonanAsetController::class, 'reject'])
        ->name('inventaris.permohonan.reject')
        ->can('approve', 'permohonan');
    // Peminjaman Aset
    Route::get('inventaris/peminjaman', [PeminjamanAsetController::class, 'index'])->name('inventaris.peminjaman.index');
    Route::post('inventaris/peminjaman', [PeminjamanAsetController::class, 'store'])->name('inventaris.peminjaman.store');
    Route::delete('inventaris/peminjaman/{id}', [PeminjamanAsetController::class, 'destroy'])->name('inventaris.peminjaman.destroy');
    Route::post('inventaris/peminjaman/{id}/kembalikan', [PeminjamanAsetController::class, 'kembalikan'])->name('inventaris.peminjaman.kembalikan');
    // Template Surat Peminjaman
    Route::get('inventaris/template-surat', [PeminjamanAsetController::class, 'indexTemplate'])->name('inventaris.template-surat.index');
    Route::post('inventaris/template-surat', [PeminjamanAsetController::class, 'storeTemplate'])->name('inventaris.template-surat.store');
    Route::get('inventaris/template-surat/{id}/download', [PeminjamanAsetController::class, 'downloadTemplate'])->name('inventaris.template-surat.download');
    Route::delete('inventaris/template-surat/{id}', [PeminjamanAsetController::class, 'destroyTemplate'])->name('inventaris.template-surat.destroy');

    // ============================================
    // ADMIN: Role & Permission Management (Superadmin Only)
    // ============================================
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/roles-permissions', [App\Http\Controllers\Admin\RolePermissionController::class, 'index'])
            ->name('roles-permissions.index');

        // Role management
        Route::post('/roles', [App\Http\Controllers\Admin\RolePermissionController::class, 'createRole'])
            ->name('roles.create');
        Route::put('/roles/{role}', [App\Http\Controllers\Admin\RolePermissionController::class, 'updateRole'])
            ->name('roles.update');
        Route::delete('/roles/{role}', [App\Http\Controllers\Admin\RolePermissionController::class, 'deleteRole'])
            ->name('roles.delete');

        // Permission management
        Route::post('/roles/{role}/permissions', [App\Http\Controllers\Admin\RolePermissionController::class, 'updateRolePermissions'])
            ->name('roles.permissions.update');
        Route::post('/roles/bulk-permissions', [App\Http\Controllers\Admin\RolePermissionController::class, 'bulkAssignPermissions'])
            ->name('roles.bulk-permissions');

        // Get role users
        Route::get('/roles/{role}/users', [App\Http\Controllers\Admin\RolePermissionController::class, 'getRoleUsers'])
            ->name('roles.users');
    });

    // Legacy detail views (keeping for now if linked directly)

    Route::post('/detail-inventaris', [DetailInventarisController::class, 'store'])->name('detail-inventaris.store');
    Route::put('/detail-inventaris/{detailAset}', [DetailInventarisController::class, 'update'])->name('detail-inventaris.update');
    Route::delete('/detail-inventaris/{detailAset}', [DetailInventarisController::class, 'destroy'])->name('detail-inventaris.destroy');

    // QR Code routes
    Route::get('/detail-inventaris/{id}/qr-download', [DetailInventarisController::class, 'downloadQr'])->name('detail-inventaris.qr-download');
    Route::get('/detail-inventaris/{id}/label-download', [DetailInventarisController::class, 'downloadLabel'])->name('detail-inventaris.label-download');
    Route::post('/detail-inventaris/{id}/qr-regenerate', [DetailInventarisController::class, 'regenerateQr'])->name('detail-inventaris.qr-regenerate');
    // Kondisi & Riwayat Kondisi
    Route::post('/detail-inventaris/{id}/update-kondisi', [DetailInventarisController::class, 'updateKondisi'])->name('detail-inventaris.update-kondisi');
    Route::get('/detail-inventaris/{id}/riwayat-kondisi', [DetailInventarisController::class, 'riwayatKondisi'])->name('detail-inventaris.riwayat-kondisi');

    // Bulk action routes
    Route::post('/detail-inventaris/bulk-delete', [DetailInventarisController::class, 'bulkDelete'])->name('detail-inventaris.bulk-delete');
    Route::post('/detail-inventaris/batch-labels', [DetailInventarisController::class, 'batchLabels'])->name('detail-inventaris.batch-labels');
    Route::post('/inventaris/permohonan/bulk-delete', [PermohonanAsetController::class, 'bulkDelete'])->name('inventaris.permohonan.bulk-delete');
    // Surat Menyurat
    Route::prefix('surat')->name('surat.')->group(function () {
        Route::get('/kirim', [SuratController::class, 'createSurat'])->name('create');
        Route::post('/kirim', [SuratController::class, 'storeSurat'])->name('store');
        Route::get('/masuk', [SuratController::class, 'suratMasuk'])->name('masuk');
        Route::get('/keluar', [SuratController::class, 'suratKeluar'])->name('keluar');
        Route::get('/arsip-resmi', [SuratController::class, 'arsipResmi'])->name('arsip-resmi');
        Route::get('/view/{id}', [SuratController::class, 'viewSurat'])->name('view');
        Route::get('/download/{id}', [SuratController::class, 'downloadSurat'])->name('download');
        Route::post('/mark-as-read/{id}', [SuratController::class, 'markAsRead'])->name('mark-as-read');
        Route::get('/count-unread', [SuratController::class, 'getUnreadCount'])->name('count-unread');
        Route::get('/surat/preview/{id}', [SuratController::class, 'previewSurat'])->name('surat.preview');
    });
    // Piket - with policy authorization
    Route::prefix('piket')->name('piket.')->group(function () {
        // View routes - dengan policy checks
        Route::get('/jadwal', [JadwalPiketController::class, 'index'])->name('jadwal.index')
            ->can('viewAny', \App\Models\JadwalPiket::class);
        Route::get('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'show'])->name('jadwal.show')
            ->can('view', 'jadwalPiket');
        Route::get('/periode-piket', [PeriodePiketController::class, 'index'])->name('periode-piket.index');
        Route::get('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'show'])->name('periode-piket.show');
        Route::get('/absensi', [AbsensiController::class, 'index'])->name('absensi.index')
            ->can('viewAny', \App\Models\Absensi::class);
        Route::get('/absensi/riwayat', [AbsensiController::class, 'show'])->name('absensi.show');
        Route::get('/rekap-absen', [AbsensiController::class, 'rekapAbsen'])->name('rekap-absen');

        // Routes untuk ganti jadwal piket - View routes (bisa akses semua)
        Route::get('/ganti-jadwal', [GantiJadwalPiketController::class, 'index'])->name('ganti-jadwal.index');
        Route::post('/ganti-jadwal', [GantiJadwalPiketController::class, 'store'])->name('ganti-jadwal.store');

        // Manipulation routes - hanya kepengurusan aktif
        Route::middleware(['active.kepengurusan:piket'])->group(function () {
            Route::post('/jadwal', [JadwalPiketController::class, 'store'])->name('jadwal.store')
                ->can('create', \App\Models\JadwalPiket::class);
            Route::put('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'update'])->name('jadwal.update')
                ->can('update', 'jadwalPiket');
            Route::delete('/jadwal/{jadwalPiket}', [JadwalPiketController::class, 'destroy'])->name('jadwal.destroy')
                ->can('delete', 'jadwalPiket');
            Route::post('/periode-piket', [PeriodePiketController::class, 'store'])->name('periode-piket.store');
            Route::put('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'update'])->name('periode-piket.update');
            Route::delete('/periode-piket/{periodePiket}', [PeriodePiketController::class, 'destroy'])->name('periode-piket.destroy');
            Route::post('/absensi/simpan', [AbsensiController::class, 'store'])->name('absensi.store');
            Route::post('/absensi/checkout', [AbsensiController::class, 'checkout'])->name('absensi.checkout');

            // Routes untuk ganti jadwal piket - Manipulation routes (hanya kepengurusan aktif)
            Route::get('/ganti-jadwal/admin', [GantiJadwalPiketController::class, 'dashboardAdmin'])->name('ganti-jadwal.admin');
            Route::post('/ganti-jadwal/{id}/approve', [GantiJadwalPiketController::class, 'approveReject'])->name('ganti-jadwal.approve');
        });
    });

    // Kuesioner Module
    Route::resource('kuesioner', App\Http\Controllers\KuesionerController::class);
    Route::get('/kuesioner/{kuesioner}/isi', [App\Http\Controllers\KuesionerController::class, 'participate'])->name('kuesioner.participate');
    Route::post('/kuesioner/{kuesioner}/submit', [App\Http\Controllers\ResponKuesionerController::class, 'store'])->name('kuesioner.submit');
    Route::get('/kuesioner/{kuesioner}/results', [App\Http\Controllers\KuesionerController::class, 'results'])->name('kuesioner.results');
    Route::get('/kuesioner/{kuesioner}/export', [App\Http\Controllers\KuesionerController::class, 'export'])->name('kuesioner.export');

    // Survey Module - LEGACY REMOVED
    // Route::resource('surveys', App\Http\Controllers\SurveyController::class);
    // Route::post('/surveys/{survey}/submit', [App\Http\Controllers\SurveyResponseController::class, 'store'])->name('surveys.submit');
    // Route::get('/surveys/{survey}/results', [App\Http\Controllers\SurveyController::class, 'results'])->name('surveys.results');
    // Route::get('/surveys/{survey}/export', [App\Http\Controllers\SurveyController::class, 'export'])->name('surveys.export');
});

// Add these routes to your web.php file
// Add these imports at the top of the file


// Then update your routes to use the correct middleware syntax
Route::middleware(['auth', 'role:superadmin|kadep'])->group(function () {
    Route::get('/user-management', [UserManagementController::class, 'index'])->name('user-management.index');
    Route::post('/user-management', [UserManagementController::class, 'store'])->name('user-management.store');
    Route::put('/user-management/{user}', [UserManagementController::class, 'update'])->name('user-management.update');
    Route::delete('/user-management/{user}', [UserManagementController::class, 'destroy'])->name('user-management.destroy');

    // Struktur Permission Management Routes
    Route::get('/struktur-permissions', [App\Http\Controllers\StrukturPermissionController::class, 'index'])
        ->name('struktur-permissions.index');
    Route::post('/struktur-permissions', [App\Http\Controllers\StrukturPermissionController::class, 'store'])
        ->name('struktur-permissions.create');
    Route::put('/struktur-permissions/{jabatan}', [App\Http\Controllers\StrukturPermissionController::class, 'update'])
        ->name('struktur-permissions.update');
    Route::delete('/struktur-permissions/{jabatan}', [App\Http\Controllers\StrukturPermissionController::class, 'destroy'])
        ->name('struktur-permissions.delete');

    // Data Master Routes
    Route::prefix('data-master')->name('data-master.')->group(function () {
        Route::resource('struktur', StrukturController::class);

        // Kategori Aset - superadmin only
        Route::middleware('role:superadmin')->group(function () {
            Route::resource('kategori-aset', KategoriAsetController::class);
            Route::post('/kategori-aset/bulk-delete', [KategoriAsetController::class, 'bulkDelete'])
                ->name('kategori-aset.bulk-delete');
        });
    });

    // Laboratorium Routes (read and edit only)
    Route::get('/laboratorium', [App\Http\Controllers\LaboratoriumController::class, 'index'])->name('laboratorium.index');
    Route::post('/laboratorium/{laboratorium}', [App\Http\Controllers\LaboratoriumController::class, 'update'])->name('laboratorium.update');
});
require __DIR__ . '/auth.php';
