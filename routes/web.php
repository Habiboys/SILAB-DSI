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
use App\Http\Controllers\AbsensiController;
use App\Http\Controllers\JadwalPiketController;
use App\Http\Controllers\PeriodePiketController;
use App\Http\Controllers\GantiJadwalPiketController;
use App\Http\Controllers\DendaPiketController;
use App\Http\Controllers\PengaturanPiketController;
use App\Http\Controllers\TagihanKasController;
use App\Http\Controllers\SuratKeluarController;
use App\Http\Controllers\SuratMasukController;
use App\Http\Controllers\DisposisiSuratController;
use App\Http\Controllers\KonfigurasiSuratController;
use App\Http\Controllers\InventarisController;
use App\Http\Controllers\DetailInventarisController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KategoriAsetController;
use App\Http\Controllers\Auth\MicrosoftSocialiteController;
use App\Http\Controllers\Auth\UnandSocialiteController;
use App\Http\Controllers\MataKuliahController;
use App\Http\Controllers\PermohonanAsetController;
use App\Http\Controllers\PeminjamanAsetController;

use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ProkerController;
use App\Http\Controllers\LpjKepengurusanController;
use Spatie\Permission\Middlewares\RoleMiddleware;

Route::get("modul/{hash}", [
    ModulPraktikumController::class,
    "viewPublic",
])->name("modul.public.view");

Route::get("aset/{id}/detail", [
    DetailInventarisController::class,
    "publicDetail",
])->name("aset.public-detail");

Route::get("/verify/{nomor}", [
    App\Http\Controllers\SertifikatVerifikasiController::class,
    "show",
])
    ->name("sertifikat.verify")
    ->where("nomor", ".+");

Route::get("/debug-auth", function () {
    $user = auth()->user();
    if (!$user) {
        return "Not logged in";
    }
    return [
        "id" => $user->id,
        "name" => $user->name,
        "roles" => $user->getRoleNames(),
        "permissions" => $user->getAllPermissions()->pluck("name"),
        "current_lab" => $user->getCurrentLab(),
    ];
});

Route::get("/", function () {
    if (auth()->check()) {
        $user = auth()->user();

        $currentLab = $user->getCurrentLab();
        if ($currentLab) {
            return redirect()->route("dashboard");
        }

        if (
            $user->hasAnyRole([
                "superadmin",
                "kadep",
                "admin",
                "kalab",
                "asisten",
                "dosen",
            ])
        ) {
            return redirect()->route("dashboard");
        }

        if ($user->hasRole("praktikan")) {
            return redirect()->route("praktikan.daftar-tugas");
        }

        return redirect()->route("dashboard");
    }
    return redirect()->route("login");
})->name("home");

Route::middleware([
    "auth:sanctum",
    \App\Http\Middleware\CheckLabAccess::class,

])->group(function () {
    Route::get("/dashboard", [
        App\Http\Controllers\DashboardController::class,
        "index",
    ])->name("dashboard");

    Route::get("/about", [
        App\Http\Controllers\AboutController::class,
        "index",
    ])->name("about");
    Route::get("/profile", [ProfileController::class, "edit"])->name(
        "profile.edit",
    );
    Route::patch("/profile", [ProfileController::class, "update"])->name(
        "profile.update",
    );
    Route::delete("/profile", [ProfileController::class, "destroy"])->name(
        "profile.destroy",
    );

    // Microsoft SSO link/unlink dari halaman profil
    Route::get("/profile/link-microsoft", [MicrosoftSocialiteController::class, "linkRedirect"])
        ->name("profile.link-microsoft");
    Route::get("/profile/link-microsoft/callback", [MicrosoftSocialiteController::class, "linkCallback"])
        ->name("profile.link-microsoft.callback");
    Route::post("/profile/unlink-microsoft", [MicrosoftSocialiteController::class, "unlink"])
        ->name("profile.unlink-microsoft");

    Route::post("/anggota/transfer-from-previous", [
        AnggotaController::class,
        "transferFromPrevious",
    ])
        ->name("anggota.transfer-from-previous")
        ->can("transfer", \App\Models\KepengurusanUser::class);
    Route::get("/anggota/active-members-from-previous", [
        AnggotaController::class,
        "getActiveMembersFromPrevious",
    ])->name("anggota.active-members-from-previous");
    Route::resource("anggota", AnggotaController::class);
    Route::resource("tahun-kepengurusan", TahunKepengurusanController::class)
        ->middlewareFor(["index", "show"], "permission:tahun_kepengurusan.view")
        ->middlewareFor(["create", "store"], "permission:tahun_kepengurusan.create")
        ->middlewareFor(["edit", "update"], "permission:tahun_kepengurusan.update")
        ->middlewareFor(["destroy"], "permission:tahun_kepengurusan.delete");
    Route::resource("kepengurusan-lab", KepengurusanLabController::class)
        ->middlewareFor(["index", "show"], "permission:kepengurusan.view")
        ->middlewareFor(
            ["create", "store", "edit", "update"],
            "permission:kepengurusan.manage-struktur|kepengurusan.manage-anggota",
        )
        ->middlewareFor(["destroy"], "permission:kepengurusan.manage-struktur");
    Route::get("/kepengurusan-lab/{kepengurusanLab}/sertifikat", [
        App\Http\Controllers\KepengurusanSertifikatController::class,
        "index",
    ])->name("kepengurusan-lab.sertifikat");
    Route::post("/kepengurusan-lab/{kepengurusanLab}/sertifikat/template", [
        App\Http\Controllers\KepengurusanSertifikatController::class,
        "uploadTemplate",
    ])->name("kepengurusan-lab.sertifikat.template");
    Route::post("/kepengurusan-lab/{kepengurusanLab}/sertifikat/generate", [
        App\Http\Controllers\KepengurusanSertifikatController::class,
        "generate",
    ])->name("kepengurusan-lab.sertifikat.generate");

    Route::get("/kegiatan/kalender", [
        App\Http\Controllers\KegiatanController::class,
        "calendarView",
    ])->name("kegiatan.calendar-view");
    Route::get("/kegiatan/calendar-data", [
        App\Http\Controllers\KegiatanController::class,
        "calendar",
    ])->name("kegiatan.calendar-data");
    Route::post("/kegiatan/{kegiatan}/approve", [
        App\Http\Controllers\KegiatanController::class,
        "approve",
    ])->name("kegiatan.approve");

    Route::post("/kegiatan/{kegiatan}/laporan", [
        App\Http\Controllers\LaporanKegiatanController::class,
        "store",
    ])->name("laporan-kegiatan.store");
    Route::delete("/laporan-kegiatan/{laporan}", [
        App\Http\Controllers\LaporanKegiatanController::class,
        "destroy",
    ])->name("laporan-kegiatan.destroy");
    Route::get("/laporan-kegiatan/{laporan}/download", [
        App\Http\Controllers\LaporanKegiatanController::class,
        "download",
    ])->name("laporan-kegiatan.download");

    Route::get("/kegiatan/{kegiatan}/peserta", [
        App\Http\Controllers\KegiatanController::class,
        "indexPeserta",
    ])->name("kegiatan.peserta.index");
    Route::post("/kegiatan/{kegiatan}/peserta", [
        App\Http\Controllers\KegiatanController::class,
        "storePeserta",
    ])->name("kegiatan.peserta.store");
    Route::delete("/kegiatan/{kegiatan}/peserta/{pesertaId}", [
        App\Http\Controllers\KegiatanController::class,
        "destroyPeserta",
    ])->name("kegiatan.peserta.destroy");

    Route::get("/kegiatan/{kegiatan}/sertifikat", [
        App\Http\Controllers\KegiatanController::class,
        "sertifikat",
    ])->name("kegiatan.sertifikat");
    Route::post("/kegiatan/{kegiatan}/template", [
        App\Http\Controllers\KegiatanController::class,
        "uploadTemplate",
    ])->name("kegiatan.template.upload");
    Route::post("/kegiatan/{kegiatan}/generate-sertifikat", [
        App\Http\Controllers\KegiatanController::class,
        "generateCertificates",
    ])->name("kegiatan.sertifikat.generate");

    Route::post("/kegiatan/{kegiatan}/dokumentasi", [
        App\Http\Controllers\DokumentasiKegiatanController::class,
        "store",
    ])->name("dokumentasi-kegiatan.store");
    Route::delete("/dokumentasi-kegiatan/{dokumentasi}", [
        App\Http\Controllers\DokumentasiKegiatanController::class,
        "destroy",
    ])->name("dokumentasi-kegiatan.destroy");
    Route::get("/dokumentasi-kegiatan/{dokumentasi}/download", [
        App\Http\Controllers\DokumentasiKegiatanController::class,
        "download",
    ])->name("dokumentasi-kegiatan.download");

    Route::resource("kegiatan", App\Http\Controllers\KegiatanController::class);

    Route::get("/proker", [ProkerController::class, "index"])
        ->name("proker.index")
        ->can("viewAny", \App\Models\Proker::class);
    Route::get("/proker/{proker}", [ProkerController::class, "show"])
        ->name("proker.show")
        ->can("view", "proker");

    Route::get("/lpj-kepengurusan/preview-page", [
        LpjKepengurusanController::class,
        "previewPage",
    ])->name("lpj-kepengurusan.preview-page");
    Route::get("/lpj-kepengurusan/preview", [
        LpjKepengurusanController::class,
        "preview",
    ])->name("lpj-kepengurusan.preview");
    Route::get("/lpj-kepengurusan/export-pdf", [
        LpjKepengurusanController::class,
        "exportPdf",
    ])->name("lpj-kepengurusan.export-pdf");

    Route::middleware(["active.kepengurusan:proker"])->group(function () {
        Route::post("/proker", [ProkerController::class, "store"])
            ->name("proker.store")
            ->can("create", \App\Models\Proker::class);
        Route::put("/proker/{proker}", [ProkerController::class, "update"])
            ->name("proker.update")
            ->can("update", "proker");
        Route::delete("/proker/{proker}", [ProkerController::class, "destroy"])
            ->name("proker.destroy")
            ->can("delete", "proker");

        Route::post("/proker/{proker}/ajukan", [
            ProkerController::class,
            "ajukan",
        ])->name("proker.ajukan");
        Route::post("/proker/{proker}/approve", [
            ProkerController::class,
            "approve",
        ])->name("proker.approve");

        Route::patch("/proker/{proker}/evaluasi", [
            ProkerController::class,
            "saveEvaluasi",
        ])->name("proker.evaluasi");

        Route::post("/proker/{proker}/pj", [
            ProkerController::class,
            "addPj",
        ])->name("proker-pj.store");
        Route::delete("/proker/{proker}/pj/{userId}", [
            ProkerController::class,
            "removePj",
        ])->name("proker-pj.destroy");

        Route::post("/proker/{proker}/parameter", [
            App\Http\Controllers\ProkerParameterController::class,
            "store",
        ])->name("proker-parameter.store");
        Route::put("/proker-parameter/{parameter}", [
            App\Http\Controllers\ProkerParameterController::class,
            "update",
        ])->name("proker-parameter.update");
        Route::delete("/proker-parameter/{parameter}", [
            App\Http\Controllers\ProkerParameterController::class,
            "destroy",
        ])->name("proker-parameter.destroy");
        Route::patch("/proker-parameter/{parameter}/capaian", [
            App\Http\Controllers\ProkerParameterController::class,
            "updateCapaian",
        ])->name("proker-parameter.capaian");

    });

    Route::get("/riwayat-keuangan", [
        RiwayatKeuanganController::class,
        "index",
    ])->name("riwayat-keuangan.index");
    Route::get("/riwayat-keuangan/export", [
        RiwayatKeuanganController::class,
        "export",
    ])->name("riwayat-keuangan.export");
    Route::get("/riwayat-keuangan/check-data", [
        RiwayatKeuanganController::class,
        "checkData",
    ])->name("riwayat-keuangan.check-data");
    Route::get("/catatan-kas", [
        RiwayatKeuanganController::class,
        "catatanKas",
    ])->name("catatan-kas");
    Route::get("/rekap-keuangan", [
        RekapKeuanganController::class,
        "index",
    ])->name("rekap-keuangan.index");

    Route::middleware(["active.kepengurusan:keuangan"])->group(function () {
        Route::post("/riwayat-keuangan", [
            RiwayatKeuanganController::class,
            "store",
        ])->name("riwayat-keuangan.store");
        Route::put("/riwayat-keuangan/{riwayatKeuangan}", [
            RiwayatKeuanganController::class,
            "update",
        ])->name("riwayat-keuangan.update");
        Route::delete("/riwayat-keuangan/{riwayatKeuangan}", [
            RiwayatKeuanganController::class,
            "destroy",
        ])->name("riwayat-keuangan.destroy");

        Route::post("/nominal-kas", [
            RiwayatKeuanganController::class,
            "storeNominalKas",
        ])->name("nominal-kas.store");
        Route::put("/nominal-kas/{nominalKas}", [
            RiwayatKeuanganController::class,
            "updateNominalKas",
        ])->name("nominal-kas.update");
        Route::delete("/nominal-kas/{nominalKas}", [
            RiwayatKeuanganController::class,
            "destroyNominalKas",
        ])->name("nominal-kas.destroy");
        Route::put("/nominal-kas/{nominalKas}/toggle-active", [
            RiwayatKeuanganController::class,
            "toggleActiveNominalKas",
        ])->name("nominal-kas.toggle-active");

        Route::post("/tagihan-kas/sync/{nominal_kas_id}", [
            TagihanKasController::class,
            "sync",
        ])->name("tagihan-kas.sync");
        Route::post("/tagihan-kas/bayar", [
            TagihanKasController::class,
            "bayar",
        ])->name("tagihan-kas.bayar");
    });

    Route::get("/praktikum", [PraktikumController::class, "index"])
        ->name("praktikum.index")
        ->can("viewAny", \App\Models\Praktikum::class);
    Route::get("/praktikum/{praktikum}", [PraktikumController::class, "show"])
        ->name("praktikum.show")
        ->can("view", "praktikum");
    Route::get("praktikum/{praktikum}/modul", [
        ModulPraktikumController::class,
        "index",
    ])
        ->name("praktikum.modul.index")
        ->can("view", "praktikum")
        ->middleware("aslab.access");
    Route::get("praktikum/{praktikum}/modul/{modul}/view/{filename?}", [
        ModulPraktikumController::class,
        "view",
    ])
        ->name("praktikum.modul.view")
        ->where("filename", ".*")
        ->can("view", "modul");

    Route::post("praktikum/{praktikum}/modul/{modul}/toggle-share", [
        ModulPraktikumController::class,
        "toggleShareLink",
    ])->name("praktikum.modul.toggle-share");

    Route::middleware(["active.kepengurusan:praktikum", "aslab.access"])->group(
        function () {
            Route::post("/praktikum", [PraktikumController::class, "store"])
                ->name("praktikum.store")
                ->can("create", \App\Models\Praktikum::class);
            Route::put("/praktikum/{praktikum}", [
                PraktikumController::class,
                "update",
            ])
                ->name("praktikum.update")
                ->can("update", "praktikum");
            Route::put("/praktikum/{praktikum}/update-info", [
                PraktikumController::class,
                "updateInfo",
            ])
                ->name("praktikum.update-info")
                ->can("update", "praktikum");
            Route::post("/praktikum/{praktikum}/kelas", [
                PraktikumController::class,
                "addKelas",
            ])
                ->name("praktikum.kelas.add")
                ->can("update", "praktikum");
            Route::put("/praktikum/{praktikum}/kelas/{kelas}", [
                PraktikumController::class,
                "updateKelas",
            ])
                ->name("praktikum.kelas.update")
                ->can("update", "praktikum");
            Route::delete("/praktikum/{praktikum}/kelas/{kelas}", [
                PraktikumController::class,
                "destroyKelas",
            ])
                ->name("praktikum.kelas.destroy")
                ->can("update", "praktikum");
            Route::delete("/praktikum/{praktikum}", [
                PraktikumController::class,
                "destroy",
            ])
                ->name("praktikum.destroy")
                ->can("delete", "praktikum");

            Route::resource(
                "praktikum.modul",
                ModulPraktikumController::class,
            )->only(["store", "update", "destroy"]);

            Route::get("praktikum/{praktikum}/praktikan", [
                App\Http\Controllers\PraktikanController::class,
                "index",
            ])->name("praktikum.praktikan.index");
            Route::post("praktikum/{praktikum}/praktikan", [
                App\Http\Controllers\PraktikanController::class,
                "store",
            ])->name("praktikum.praktikan.store");
            Route::post("praktikum/{praktikum}/praktikan/add-existing", [
                App\Http\Controllers\PraktikanController::class,
                "addExistingUser",
            ])->name("praktikum.praktikan.add-existing");
            Route::post("praktikum/{praktikum}/praktikan/import", [
                App\Http\Controllers\PraktikanController::class,
                "import",
            ])->name("praktikum.praktikan.import");
            Route::put("praktikum/{praktikum}/praktikan/{praktikan}", [
                App\Http\Controllers\PraktikanController::class,
                "update",
            ])->name("praktikum.praktikan.update");
            Route::put(
                "praktikum/{praktikum}/praktikan/{praktikan}/assign-kelas",
                [
                    App\Http\Controllers\PraktikanController::class,
                    "assignToKelas",
                ],
            )->name("praktikum.praktikan.assign-kelas");
            Route::put(
                "praktikum/{praktikum}/praktikan/{praktikan}/remove-kelas",
                [
                    App\Http\Controllers\PraktikanController::class,
                    "removeFromKelas",
                ],
            )->name("praktikum.praktikan.remove-kelas");
            Route::post("praktikum/{praktikum}/praktikan/pindah-kelas-massal", [
                App\Http\Controllers\PraktikanController::class,
                "pindahKelasMassal",
            ])->name("praktikum.praktikan.pindah-kelas-massal");
            Route::put("praktikum/praktikan/{praktikan}/status", [
                App\Http\Controllers\PraktikanController::class,
                "updateStatus",
            ])->name("praktikum.praktikan.update-status");
            Route::delete("praktikum/praktikan/{praktikan}", [
                App\Http\Controllers\PraktikanController::class,
                "destroy",
            ])->name("praktikum.praktikan.destroy");

            Route::resource(
                "praktikum.modul",
                ModulPraktikumController::class,
            )->only(["store", "update", "destroy"]);

            Route::get("praktikum/{praktikum}/tugas", [
                App\Http\Controllers\TugasPraktikumController::class,
                "index",
            ])->name("praktikum.tugas.index");
            Route::post("praktikum/{praktikum}/tugas", [
                App\Http\Controllers\TugasPraktikumController::class,
                "store",
            ])->name("praktikum.tugas.store");
            Route::put("praktikum/tugas/{tugas}", [
                App\Http\Controllers\TugasPraktikumController::class,
                "update",
            ])->name("praktikum.tugas.update");
            Route::delete("praktikum/tugas/{tugas}", [
                App\Http\Controllers\TugasPraktikumController::class,
                "destroy",
            ])->name("praktikum.tugas.destroy");
            Route::get("praktikum/tugas/{tugas}/download", [
                App\Http\Controllers\TugasPraktikumController::class,
                "downloadFile",
            ])->name("praktikum.tugas.download");
            Route::get("praktikum/tugas/{tugas}/view", [
                App\Http\Controllers\TugasPraktikumController::class,
                "viewFile",
            ])->name("praktikum.tugas.view");

            Route::get("praktikum/tugas/{tugas}/pengumpulan", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "index",
            ])->name("praktikum.tugas.pengumpulan.index");
            Route::put("praktikum/pengumpulan/{pengumpulan}", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "update",
            ])->name("praktikum.pengumpulan.update");
            Route::delete("praktikum/pengumpulan/{pengumpulan}", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "destroy",
            ])->name("praktikum.pengumpulan.destroy");
            Route::get("praktikum/pengumpulan/{pengumpulan}/download", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "downloadFile",
            ])->name("praktikum.pengumpulan.download");

            Route::get("praktikum/tugas/{tugas}/submissions", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "adminSubmissions",
            ])->name("praktikum.tugas.submissions");
            Route::get("praktikum/tugas/{tugas}/export-grades", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "exportGrades",
            ])->name("praktikum.tugas.export-grades");
            Route::get("praktikum/{praktikum}/export-grades", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "exportMultipleGrades",
            ])->name("praktikum.export-grades");

            Route::get(
                "praktikum/{praktikum}/tugas/{tugas}/download-nilai-template",
                [
                    App\Http\Controllers\PengumpulanTugasController::class,
                    "downloadNilaiTemplate",
                ],
            )->name("praktikum.tugas.download-nilai-template");
            Route::post("praktikum/{praktikum}/tugas/{tugas}/import-nilai", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "importNilai",
            ])->name("praktikum.tugas.import-nilai");
            Route::put("praktikum/submission/{pengumpulan}/grade", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "gradeSubmission",
            ])->name("praktikum.submission.grade");
            Route::post("praktikum/submission/rubrik-grade", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "storeNilaiRubrik",
            ])->name("praktikum.submission.rubrik-grade");
            Route::post("praktikum/submission/matrix-grade", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "storeMatrixNilaiRubrik",
            ])->name("praktikum.submission.matrix-grade");
            Route::put("praktikum/submission/{pengumpulan}/reject", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "rejectSubmission",
            ])->name("praktikum.submission.reject");
            Route::get("praktikum/pengumpulan/download/{filename}", [
                App\Http\Controllers\PengumpulanTugasController::class,
                "downloadFileByFilename",
            ])->name("praktikum.pengumpulan.download.filename");

            Route::get("praktikum/tugas/{tugas}/komponen", [
                App\Http\Controllers\KomponenRubrikController::class,
                "index",
            ])->name("praktikum.tugas.komponen.index");
            Route::post("praktikum/tugas/{tugas}/komponen", [
                App\Http\Controllers\KomponenRubrikController::class,
                "store",
            ])->name("praktikum.tugas.komponen.store");
            Route::put("praktikum/tugas/{tugas}/komponen/{komponen}", [
                App\Http\Controllers\KomponenRubrikController::class,
                "update",
            ])->name("praktikum.tugas.komponen.update");
            Route::delete("praktikum/tugas/{tugas}/komponen/{komponen}", [
                App\Http\Controllers\KomponenRubrikController::class,
                "destroy",
            ])->name("praktikum.tugas.komponen.destroy");
            Route::put("praktikum/tugas/{tugas}/komponen-urutan", [
                App\Http\Controllers\KomponenRubrikController::class,
                "updateUrutan",
            ])->name("praktikum.tugas.komponen.update-urutan");

            Route::post("praktikum/tugas/{tugas}/nilai-tambahan", [
                App\Http\Controllers\KomponenRubrikController::class,
                "storeNilaiTambahan",
            ])->name("praktikum.tugas.nilai-tambahan.store");
            Route::get(
                "praktikum/tugas/{tugas}/praktikan/{praktikan}/nilai-tambahan",
                [
                    App\Http\Controllers\KomponenRubrikController::class,
                    "getNilaiTambahan",
                ],
            )->name("praktikum.tugas.nilai-tambahan.get");
            Route::put("praktikum/tugas/{tugas}/nilai-tambahan/{nilai}", [
                App\Http\Controllers\KomponenRubrikController::class,
                "updateNilaiTambahan",
            ])->name("praktikum.tugas.nilai-tambahan.update");
            Route::delete("praktikum/tugas/{tugas}/nilai-tambahan/{nilai}", [
                App\Http\Controllers\KomponenRubrikController::class,
                "deleteNilaiTambahan",
            ])->name("praktikum.tugas.nilai-tambahan.delete");

            Route::get("praktikum/{praktikum}/aslab", [
                App\Http\Controllers\AslabPraktikumController::class,
                "index",
            ])->name("praktikum.aslab.index");
            Route::post("praktikum/{praktikum}/aslab", [
                App\Http\Controllers\AslabPraktikumController::class,
                "store",
            ])->name("praktikum.aslab.store");
            Route::delete("praktikum/{praktikum}/aslab/{aslab}", [
                App\Http\Controllers\AslabPraktikumController::class,
                "destroy",
            ])->name("praktikum.aslab.destroy");

            Route::post("praktikum/{praktikum}/kelas/{kelas}/sub-kelas", [
                App\Http\Controllers\KelasController::class,
                "storeSubKelas",
            ])->name("praktikum.kelas.sub-kelas.store");
            Route::put("praktikum/kelas/sub-kelas/{subKelas}", [
                App\Http\Controllers\KelasController::class,
                "updateSubKelas",
            ])->name("praktikum.kelas.sub-kelas.update");
            Route::delete("praktikum/kelas/sub-kelas/{subKelas}", [
                App\Http\Controllers\KelasController::class,
                "destroySubKelas",
            ])->name("praktikum.kelas.sub-kelas.destroy");

            Route::post("praktikum/kelas/{kelas}/pindah-praktikan", [
                App\Http\Controllers\KelasController::class,
                "pindahkanPraktikan",
            ])->name("kelas.pindah-praktikan");
            Route::post("praktikum/kelas/{kelas}/pindah-pertemuan", [
                App\Http\Controllers\KelasController::class,
                "pindahkanPertemuan",
            ])->name("kelas.pindah-pertemuan");
            Route::post("praktikum/kelas/{kelas}/pindah-tugas", [
                App\Http\Controllers\KelasController::class,
                "pindahkanTugas",
            ])->name("kelas.pindah-tugas");

            Route::get("praktikum/{praktikum}/pertemuan", [
                App\Http\Controllers\PertemuanPraktikumController::class,
                "index",
            ])->name("praktikum.pertemuan.index");
            Route::post("praktikum/{praktikum}/pertemuan", [
                App\Http\Controllers\PertemuanPraktikumController::class,
                "store",
            ])->name("praktikum.pertemuan.store");
            Route::put("praktikum/pertemuan/{pertemuan}", [
                App\Http\Controllers\PertemuanPraktikumController::class,
                "update",
            ])->name("praktikum.pertemuan.update");
            Route::delete("praktikum/pertemuan/{pertemuan}", [
                App\Http\Controllers\PertemuanPraktikumController::class,
                "destroy",
            ])->name("praktikum.pertemuan.destroy");

            Route::get("praktikum/pertemuan/{pertemuan}/absensi", [
                App\Http\Controllers\PraktikumAbsensiController::class,
                "index",
            ])->name("praktikum.absensi.index");
            Route::post("praktikum/pertemuan/{pertemuan}/absensi-praktikan", [
                App\Http\Controllers\PraktikumAbsensiController::class,
                "storePraktikan",
            ])->name("praktikum.absensi.praktikan.store");
            Route::post("praktikum/pertemuan/{pertemuan}/absensi-aslab", [
                App\Http\Controllers\PraktikumAbsensiController::class,
                "storeAslab",
            ])->name("praktikum.absensi.aslab.store");

            Route::get(
                "praktikum/{praktikum}/absensi/export-praktikan/{kelasId}",
                [
                    App\Http\Controllers\PertemuanPraktikumController::class,
                    "exportPraktikan",
                ],
            )->name("praktikum.absensi.export-praktikan");
            Route::get("praktikum/{praktikum}/absensi/export-aslab/{kelasId}", [
                App\Http\Controllers\PertemuanPraktikumController::class,
                "exportAslab",
            ])->name("praktikum.absensi.export-aslab");

            Route::get("praktikum/{praktikum}/sertifikat", [
                App\Http\Controllers\PraktikumSertifikatController::class,
                "index",
            ])->name("praktikum.sertifikat.index");
            Route::post("praktikum/{praktikum}/sertifikat/template", [
                App\Http\Controllers\PraktikumSertifikatController::class,
                "uploadTemplate",
            ])->name("praktikum.sertifikat.template");
            Route::post("praktikum/{praktikum}/sertifikat/generate", [
                App\Http\Controllers\PraktikumSertifikatController::class,
                "generate",
            ])->name("praktikum.sertifikat.generate");
        },
    );

    Route::middleware(["auth", "role:praktikan"])->group(function () {
        Route::get("/praktikan/daftar-tugas", [
            App\Http\Controllers\PraktikanController::class,
            "daftarTugas",
        ])->name("praktikan.daftar-tugas");
        Route::get("/praktikan/tugas/{tugas}", [
            App\Http\Controllers\PraktikanController::class,
            "detailTugas",
        ])->name("praktikan.tugas.show");
        Route::get("/praktikan/tugas/{tugas}/view-instruksi", [
            App\Http\Controllers\TugasPraktikumController::class,
            "viewFile",
        ])->name("praktikan.tugas.view-instruksi");
        Route::get("/praktikan/praktikum/{praktikum}/tugas", [
            App\Http\Controllers\PraktikanController::class,
            "praktikumTugas",
        ])->name("praktikan.praktikum.tugas");
        Route::get("/praktikan/riwayat-tugas", [
            App\Http\Controllers\PraktikanController::class,
            "riwayatTugas",
        ])->name("praktikan.riwayat");
        Route::get("/praktikan/riwayat-tugas/praktikum/{praktikum}", [
            App\Http\Controllers\PraktikanController::class,
            "riwayatTugasByPraktikum",
        ])->name("praktikan.riwayat.praktikum");
        Route::get("/praktikan/riwayat-tugas/{pengumpulan}", [
            App\Http\Controllers\PraktikanController::class,
            "detailRiwayatTugas",
        ])->name("praktikan.riwayat.show");

        Route::post("/praktikum/tugas/{tugas}/pengumpulan", [
            App\Http\Controllers\PengumpulanTugasController::class,
            "store",
        ])->name("praktikum.tugas.pengumpulan.store");
        Route::delete("/praktikum/pengumpulan/{pengumpulan}/cancel", [
            App\Http\Controllers\PengumpulanTugasController::class,
            "cancelSubmission",
        ])->name("praktikum.pengumpulan.cancel");

        Route::get("/praktikan/modul", [
            App\Http\Controllers\ModulPraktikumController::class,
            "studentIndex",
        ])->name("praktikan.modul.index");
        Route::get("/praktikan/modul/{praktikum}", [
            App\Http\Controllers\ModulPraktikumController::class,
            "studentPraktikumModul",
        ])->name("praktikan.modul.praktikum");
    });

    Route::middleware(["auth"])->group(function () {
        Route::get("/praktikum/pengumpulan/download/{filename}", [
            App\Http\Controllers\PengumpulanTugasController::class,
            "downloadFileByFilename",
        ])->name("praktikum.pengumpulan.download.filename");
    });

    Route::get("/praktikan/template-download", [
        App\Http\Controllers\PraktikanController::class,
        "downloadTemplate",
    ])->name("praktikan.template.download");
    Route::get("kepengurusan-lab/{kepengurusanLab}/download-sk", [
        KepengurusanLabController::class,
        "downloadSk",
    ])
        ->middleware("permission:kepengurusan.view")
        ->name("kepengurusan-lab.download-sk");
    Route::patch("kepengurusan-lab/{kepengurusanLab}/toggle-active", [
        KepengurusanLabController::class,
        "toggleActive",
    ])
        ->middleware("permission:kepengurusan.manage-struktur")
        ->name("kepengurusan-lab.toggle-active");

    Route::get("/sertifikat", [
        App\Http\Controllers\SertifikatController::class,
        "indexAll",
    ])
        ->middleware("permission:sertifikat.view")
        ->name("sertifikat.all");
    Route::get("/sertifikat-saya", [
        App\Http\Controllers\SertifikatController::class,
        "index",
    ])->name("sertifikat.index");
    Route::get("/sertifikat-saya/{sertifikat}/download", [
        App\Http\Controllers\SertifikatController::class,
        "download",
    ])->name("sertifikat.download");

    Route::get("/api/check-kepengurusan-status", function (Request $request) {
        $lab_id = $request->input("lab_id");
        $modul = $request->input("modul");

        if (!$lab_id) {
            return response()->json(["error" => "Lab ID tidak ditemukan"], 400);
        }

        $hasActiveKepengurusan = \App\Helpers\KepengurusanHelper::hasActiveKepengurusan(
            $lab_id,
        );
        $canAccessModul = $hasActiveKepengurusan
            ? \App\Helpers\KepengurusanHelper::canAccessModul($lab_id, $modul)
            : false;

        return response()->json([
            "has_active_kepengurusan" => $hasActiveKepengurusan,
            "can_access_modul" => $canAccessModul,
            "message" => \App\Helpers\KepengurusanHelper::getModulAccessMessage(
                $lab_id,
                $modul,
            ),
        ]);
    })->name("api.check-kepengurusan-status");

    Route::get("inventaris", [InventarisController::class, "index"])
        ->name("inventaris.index")
        ->can("viewAny", \App\Models\Inventaris::class);
    Route::get("inventaris/export-excel", [
        InventarisController::class,
        "exportExcel",
    ])->name("inventaris.export-excel");
    Route::resource(
        "inventaris/permohonan",
        PermohonanAsetController::class,
    )->names("inventaris.permohonan")->except(['edit', 'create']);

    Route::post("inventaris/permohonan/{permohonan}/submit", [
        PermohonanAsetController::class,
        "submit",
    ])->name("inventaris.permohonan.submit");

    Route::post("inventaris/permohonan/{permohonan}/review-kalab", [
        PermohonanAsetController::class,
        "reviewKalab",
    ])->name("inventaris.permohonan.review-kalab");

    Route::post("inventaris/permohonan/{permohonan}/approve-kadep", [
        PermohonanAsetController::class,
        "approveKadep",
    ])->name("inventaris.permohonan.approve-kadep");

    Route::post("inventaris/wishlist/{wishlistItem}/convert-to-aset", [
        PermohonanAsetController::class,
        "convertToAset",
    ])->name("inventaris.wishlist.convert-to-aset");

    Route::get("inventaris/peminjaman", [
        PeminjamanAsetController::class,
        "index",
    ])
        ->middleware('permission:inventaris.view')
        ->name("inventaris.peminjaman.index");
    Route::post("inventaris/peminjaman", [
        PeminjamanAsetController::class,
        "store",
    ])
        ->middleware('permission:inventaris.manage-peminjaman|inventaris.manage-items')
        ->name("inventaris.peminjaman.store");
    Route::delete("inventaris/peminjaman/{id}", [
        PeminjamanAsetController::class,
        "destroy",
    ])
        ->middleware('permission:inventaris.manage-peminjaman|inventaris.manage-items')
        ->name("inventaris.peminjaman.destroy");
    Route::post("inventaris/peminjaman/{id}/kembalikan", [
        PeminjamanAsetController::class,
        "kembalikan",
    ])
        ->middleware('permission:inventaris.manage-peminjaman|inventaris.manage-items')
        ->name("inventaris.peminjaman.kembalikan");
    Route::post("inventaris/peminjaman/items/{itemId}/kembalikan", [
        PeminjamanAsetController::class,
        "kembalikanItem",
    ])
        ->middleware('permission:inventaris.manage-peminjaman|inventaris.manage-items')
        ->name("inventaris.peminjaman.kembalikan-item");

    Route::prefix("admin")
        ->name("admin.")
        ->group(function () {
            Route::get("/roles-permissions", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "index",
            ])->name("roles-permissions.index");

            Route::post("/roles", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "createRole",
            ])->name("roles.create");
            Route::put("/roles/{role}", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "updateRole",
            ])->name("roles.update");
            Route::delete("/roles/{role}", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "deleteRole",
            ])->name("roles.delete");

            Route::post("/roles/{role}/permissions", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "updateRolePermissions",
            ])->name("roles.permissions.update");
            Route::post("/roles/bulk-permissions", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "bulkAssignPermissions",
            ])->name("roles.bulk-permissions");

            Route::get("/roles/{role}/users", [
                App\Http\Controllers\Admin\RolePermissionController::class,
                "getRoleUsers",
            ])->name("roles.users");
        });

    Route::post("/detail-inventaris", [
        DetailInventarisController::class,
        "store",
    ])->name("detail-inventaris.store");
    Route::put("/detail-inventaris/{detailAset}", [
        DetailInventarisController::class,
        "update",
    ])->name("detail-inventaris.update");
    Route::delete("/detail-inventaris/{detailAset}", [
        DetailInventarisController::class,
        "destroy",
    ])->name("detail-inventaris.destroy");

    Route::get("/detail-inventaris/{id}/qr-download", [
        DetailInventarisController::class,
        "downloadQr",
    ])->name("detail-inventaris.qr-download");
    Route::get("/detail-inventaris/{id}/label-download", [
        DetailInventarisController::class,
        "downloadLabel",
    ])->name("detail-inventaris.label-download");
    Route::post("/detail-inventaris/{id}/qr-regenerate", [
        DetailInventarisController::class,
        "regenerateQr",
    ])->name("detail-inventaris.qr-regenerate");

    Route::post("/detail-inventaris/{id}/update-kondisi", [
        DetailInventarisController::class,
        "updateKondisi",
    ])->name("detail-inventaris.update-kondisi");
    Route::get("/detail-inventaris/{id}/riwayat-kondisi", [
        DetailInventarisController::class,
        "riwayatKondisi",
    ])->name("detail-inventaris.riwayat-kondisi");
    Route::get("/detail-inventaris/{id}/riwayat-peminjaman", [
        DetailInventarisController::class,
        "riwayatPeminjaman",
    ])->name("detail-inventaris.riwayat-peminjaman");

    Route::post("/detail-inventaris/bulk-delete", [
        DetailInventarisController::class,
        "bulkDelete",
    ])->name("detail-inventaris.bulk-delete");
    Route::post("/detail-inventaris/batch-labels", [
        DetailInventarisController::class,
        "batchLabels",
    ])->name("detail-inventaris.batch-labels");
    Route::post("/inventaris/permohonan/bulk-delete", [
        PermohonanAsetController::class,
        "bulkDelete",
    ])->name("inventaris.permohonan.bulk-delete");

    Route::prefix("surat-menyurat")
        ->name("surat-menyurat.")
        ->group(function () {

            Route::get("/surat-keluar", [
                SuratKeluarController::class,
                "index",
            ])->name("surat-keluar.index");
            Route::get("/surat-keluar/export", [
                SuratKeluarController::class,
                "export",
            ])->name("surat-keluar.export");
            Route::post("/surat-keluar", [
                SuratKeluarController::class,
                "store",
            ])->name("surat-keluar.store");
            Route::put("/surat-keluar/{id}", [
                SuratKeluarController::class,
                "update",
            ])->name("surat-keluar.update");
            Route::delete("/surat-keluar/{id}", [
                SuratKeluarController::class,
                "destroy",
            ])->name("surat-keluar.destroy");
            Route::get("/surat-keluar/{id}/download", [
                SuratKeluarController::class,
                "download",
            ])->name("surat-keluar.download");

            Route::get("/surat-masuk", [
                SuratMasukController::class,
                "index",
            ])->name("surat-masuk.index");
            Route::get("/surat-masuk/export", [
                SuratMasukController::class,
                "export",
            ])->name("surat-masuk.export");
            Route::post("/surat-masuk", [
                SuratMasukController::class,
                "store",
            ])->name("surat-masuk.store");
            Route::put("/surat-masuk/{id}", [
                SuratMasukController::class,
                "update",
            ])->name("surat-masuk.update");
            Route::delete("/surat-masuk/{id}", [
                SuratMasukController::class,
                "destroy",
            ])->name("surat-masuk.destroy");
            Route::get("/surat-masuk/{id}/download", [
                SuratMasukController::class,
                "download",
            ])->name("surat-masuk.download");
            Route::get("/surat-masuk/{id}/disposisi", [
                SuratMasukController::class,
                "showDisposisi",
            ])->name("surat-masuk.disposisi");

            Route::post("/surat-masuk/{suratMasukId}/disposisi", [
                DisposisiSuratController::class,
                "store",
            ])->name("disposisi.store");
            Route::patch("/disposisi/{id}/status", [
                DisposisiSuratController::class,
                "updateStatus",
            ])->name("disposisi.update-status");

            Route::get("/konfigurasi", [
                KonfigurasiSuratController::class,
                "show",
            ])->name("konfigurasi.show");
            Route::post("/konfigurasi", [
                KonfigurasiSuratController::class,
                "upsert",
            ])->name("konfigurasi.upsert");
        });

    Route::prefix("piket")
        ->name("piket.")
        ->group(function () {

            Route::get("/jadwal", [JadwalPiketController::class, "index"])
                ->name("jadwal.index")
                ->can("viewAny", \App\Models\JadwalPiket::class);
            Route::get("/jadwal/{jadwalPiket}", [
                JadwalPiketController::class,
                "show",
            ])
                ->name("jadwal.show")
                ->can("view", "jadwalPiket");
            Route::get("/periode-piket", [
                PeriodePiketController::class,
                "index",
            ])->name("periode-piket.index");
            Route::get("/periode-piket/{periodePiket}", [
                PeriodePiketController::class,
                "show",
            ])->name("periode-piket.show");
            Route::get("/absensi", [AbsensiController::class, "index"])
                ->name("absensi.index")
                ->can("viewAny", \App\Models\Absensi::class);
            Route::get("/absensi/riwayat", [
                AbsensiController::class,
                "show",
            ])->name("absensi.show");
            Route::post("/absensi/manual", [
                AbsensiController::class,
                "storeManual",
            ])->name("absensi.manual.store");
            Route::put("/absensi/manual/{id}", [
                AbsensiController::class,
                "updateManual",
            ])->name("absensi.manual.update");
            Route::delete("/absensi/manual/{id}", [
                AbsensiController::class,
                "destroyManual",
            ])->name("absensi.manual.destroy");
            Route::patch("/absensi/{id}/verify", [
                AbsensiController::class,
                "verify",
            ])->name("absensi.verify");
            Route::get("/rekap-absen", [
                AbsensiController::class,
                "rekapAbsen",
            ])->name("rekap-absen");

            Route::post("/denda-piket/sync/{periode_piket_id}", [
                DendaPiketController::class,
                "sync",
            ])->name("denda-piket.sync");
            Route::post("/denda-piket/bayar", [
                DendaPiketController::class,
                "bayar",
            ])->name("denda-piket.bayar");

            Route::get("/ganti-jadwal", [
                GantiJadwalPiketController::class,
                "index",
            ])->name("ganti-jadwal.index");
            Route::post("/ganti-jadwal", [
                GantiJadwalPiketController::class,
                "store",
            ])->name("ganti-jadwal.store");

            Route::middleware(["active.kepengurusan:piket"])->group(
                function () {
                    Route::post("/jadwal", [
                        JadwalPiketController::class,
                        "store",
                    ])
                        ->name("jadwal.store")
                        ->can("create", \App\Models\JadwalPiket::class);
                    Route::put("/jadwal/{jadwalPiket}", [
                        JadwalPiketController::class,
                        "update",
                    ])
                        ->name("jadwal.update")
                        ->can("update", "jadwalPiket");
                    Route::delete("/jadwal/{jadwalPiket}", [
                        JadwalPiketController::class,
                        "destroy",
                    ])
                        ->name("jadwal.destroy")
                        ->can("delete", "jadwalPiket");
                    Route::post("/periode-piket", [
                        PeriodePiketController::class,
                        "store",
                    ])->name("periode-piket.store");
                    Route::post("/periode-piket/generate", [
                        PeriodePiketController::class,
                        "autoGenerate",
                    ])->name("periode-piket.generate");
                    Route::put("/periode-piket/{periodePiket}", [
                        PeriodePiketController::class,
                        "update",
                    ])->name("periode-piket.update");
                    Route::delete("/periode-piket/{periodePiket}", [
                        PeriodePiketController::class,
                        "destroy",
                    ])->name("periode-piket.destroy");
                    Route::post("/pengaturan-piket", [
                        PengaturanPiketController::class,
                        "upsert",
                    ])->name("pengaturan-piket.upsert");
                    Route::post("/absensi/simpan", [
                        AbsensiController::class,
                        "store",
                    ])->name("absensi.store");
                    Route::post("/absensi/checkout", [
                        AbsensiController::class,
                        "checkout",
                    ])->name("absensi.checkout");

                    Route::get("/ganti-jadwal/admin", [
                        GantiJadwalPiketController::class,
                        "dashboardAdmin",
                    ])->name("ganti-jadwal.admin");
                    Route::post("/ganti-jadwal/{id}/approve", [
                        GantiJadwalPiketController::class,
                        "approveReject",
                    ])->name("ganti-jadwal.approve");
                },
            );
        });

    Route::resource(
        "kuesioner",
        App\Http\Controllers\KuesionerController::class,
    );
    Route::get("/kuesioner/{kuesioner}/isi", [
        App\Http\Controllers\KuesionerController::class,
        "participate",
    ])->name("kuesioner.participate");
    Route::post("/kuesioner/{kuesioner}/submit", [
        App\Http\Controllers\ResponKuesionerController::class,
        "store",
    ])->name("kuesioner.submit");
    Route::get("/kuesioner/{kuesioner}/results", [
        App\Http\Controllers\KuesionerController::class,
        "results",
    ])->name("kuesioner.results");
    Route::get("/kuesioner/{kuesioner}/export", [
        App\Http\Controllers\KuesionerController::class,
        "export",
    ])->name("kuesioner.export");

});

Route::middleware(["auth", "role:superadmin|kadep|admin"])->group(function () {
    Route::get("/user-management", [
        UserManagementController::class,
        "index",
    ])->name("user-management.index");
    Route::post("/user-management", [
        UserManagementController::class,
        "store",
    ])->name("user-management.store");
    Route::put("/user-management/{user}", [
        UserManagementController::class,
        "update",
    ])->name("user-management.update");
    Route::delete("/user-management/{user}", [
        UserManagementController::class,
        "destroy",
    ])->name("user-management.destroy");
    Route::post("/user-management/{user}/approve", [
        UserManagementController::class,
        "approve",
    ])->name("user-management.approve");

    Route::get("/struktur-permissions", [
        App\Http\Controllers\StrukturPermissionController::class,
        "index",
    ])->name("struktur-permissions.index");
    Route::post("/struktur-permissions", [
        App\Http\Controllers\StrukturPermissionController::class,
        "store",
    ])->name("struktur-permissions.create");
    Route::put("/struktur-permissions/{jabatan}", [
        App\Http\Controllers\StrukturPermissionController::class,
        "update",
    ])->name("struktur-permissions.update");
    Route::delete("/struktur-permissions/{jabatan}", [
        App\Http\Controllers\StrukturPermissionController::class,
        "destroy",
    ])->name("struktur-permissions.delete");

    Route::prefix("data-master")
        ->name("data-master.")
        ->group(function () {
            Route::resource("struktur", StrukturController::class);
            Route::resource("mata-kuliah", MataKuliahController::class)->only([
                "index",
                "store",
                "update",
                "destroy",
            ]);

            Route::middleware("role:superadmin")->group(function () {
                Route::resource("kategori-aset", KategoriAsetController::class);
                Route::post("/kategori-aset/bulk-delete", [
                    KategoriAsetController::class,
                    "bulkDelete",
                ])->name("kategori-aset.bulk-delete");
            });
        });

    Route::get("/laboratorium", [
        App\Http\Controllers\LaboratoriumController::class,
        "index",
    ])->name("laboratorium.index");
    Route::post("/laboratorium", [
        App\Http\Controllers\LaboratoriumController::class,
        "store",
    ])->name("laboratorium.store");
    Route::post("/laboratorium/{laboratorium}/toggle", [
        App\Http\Controllers\LaboratoriumController::class,
        "toggle",
    ])->name("laboratorium.toggle");
    Route::post("/laboratorium/{laboratorium}", [
        App\Http\Controllers\LaboratoriumController::class,
        "update",
    ])->name("laboratorium.update");
});

Route::middleware('auth')->post('/fcm/token', [
    App\Http\Controllers\FcmController::class,
    'updateToken',
])->name('fcm.update-token');

Route::middleware('auth')->group(function () {
    Route::get('/notifikasi', [App\Http\Controllers\NotifikasiController::class, 'index'])->name('notifikasi.index');
    Route::post('/notifikasi/{id}/read', [App\Http\Controllers\NotifikasiController::class, 'markAsRead'])->name('notifikasi.read');
    Route::post('/notifikasi/read-all', [App\Http\Controllers\NotifikasiController::class, 'markAllAsRead'])->name('notifikasi.read-all');
});

require __DIR__ . "/auth.php";
