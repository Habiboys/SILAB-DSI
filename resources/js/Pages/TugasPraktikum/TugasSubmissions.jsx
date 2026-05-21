
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    FileSpreadsheet,
    FileText,
    Plus,
    Save,
    Settings,
    Upload,
    X,
    XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import ManageNilaiTambahanModal from "../../Components/ManageNilaiTambahanModal";
import Modal from "../../Components/Modal";
import ModernPdfViewer from "../../Components/ModernPdfViewer";
import NilaiTambahanModal from "../../Components/NilaiTambahanModal";
import { usePermission } from "../../Components/PermissionContext";
import RubrikGradingModal from "../../Components/RubrikGradingModal";
import DashboardLayout from "../../Layouts/DashboardLayout";

export default function TugasSubmissions({
    tugas,
    submissions,
    nonSubmittedPraktikans,
    praktikum,
}) {
    const { props } = usePage();
    const { can, hasRole } = usePermission();
    const isAdmin = hasRole(["admin", "superadmin"]);
    const isKadep = hasRole("kadep");
    const canGrade = can("tugas.grade") || isAdmin || isKadep;
    const canUpdate = can("tugas.update") || isAdmin || isKadep;

    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isRubrikGradingOpen, setIsRubrikGradingOpen] = useState(false);
    const [isNilaiTambahanOpen, setIsNilaiTambahanOpen] = useState(false);
    const [isManageNilaiTambahanOpen, setIsManageNilaiTambahanOpen] =
        useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [inlineNilaiData, setInlineNilaiData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [savingPraktikan, setSavingPraktikan] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [modifiedData, setModifiedData] = useState(new Set());
    const [feedbackData, setFeedbackData] = useState({});
    const [gradeForm, setGradeForm] = useState({
        nilai: "",
        feedback: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
    const [selectedPdfFile, setSelectedPdfFile] = useState({
        url: "",
        filename: "",
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState({
        action: null,
        submission: null,
        type: "warning",
    });
    const [rejectReason, setRejectReason] = useState("");
    const [isCatatanModalOpen, setIsCatatanModalOpen] = useState(false);
    const [selectedCatatan, setSelectedCatatan] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredSubmissions, setFilteredSubmissions] = useState(
        submissions || [],
    );
    const [filteredNonSubmitted, setFilteredNonSubmitted] = useState(
        nonSubmittedPraktikans || [],
    );
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [hoveredCatatan, setHoveredCatatan] = useState(null);
    const [selectedPdfSubmission, setSelectedPdfSubmission] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleColumns, setVisibleColumns] = useState({
        praktikan: true,
        status: true,
        file: true,
        catatan: true,
        waktu: true,
        komponen: true,
        total: true,
        feedback: true,
        nilai_tambahan: true,
        aksi: true,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    const normalizeIdValue = (id) =>
        id === null || id === undefined || id === "" ? null : String(id);

    const resolvePraktikanId = (item) =>
        normalizeIdValue(
            item?.praktikan_id ??
                item?.praktikan?.id ??
                item?.praktikan_praktikum?.praktikan_id,
        );

    const normalizedSubmissions = React.useMemo(
        () =>
            (submissions || []).map((submission) => ({
                ...submission,
                praktikan_id: resolvePraktikanId(submission),
            })),
        [submissions],
    );

    const normalizedNonSubmittedPraktikans = React.useMemo(
        () =>
            (nonSubmittedPraktikans || []).map((student) => ({
                ...student,
                praktikan_id: resolvePraktikanId(student),
            })),
        [nonSubmittedPraktikans],
    );

    const praktikumId =
        praktikum?.id ||
        tugas?.praktikum?.id ||
        tugas?.praktikum_id ||
        tugas?.kelas?.praktikum_id;
    const kelasId = tugas?.kelas_id || tugas?.kelas?.id;

    
    const getCsrfToken = () => {
        return (
            props.csrf_token ||
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content")
        );
    };

    
    const handleDownloadTemplate = () => {
        if (!praktikumId) {
            toast.error("ID praktikum tidak ditemukan");
            return;
        }
        const url = `/praktikum/${praktikumId}/tugas/${tugas.id}/download-nilai-template`;
        window.open(url, "_blank");
    };

    
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            
            const allowedTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            ];

            if (!allowedTypes.includes(file.type)) {
                toast.error("File harus berupa Excel (.xlsx atau .xls)");
                return;
            }

            
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 10MB");
                return;
            }

            setImportFile(file);
        }
    };

    
    const handleImportNilai = async () => {
        if (!importFile) {
            toast.error("Pilih file Excel terlebih dahulu");
            return;
        }

        if (!praktikumId) {
            toast.error("ID praktikum tidak ditemukan");
            return;
        }

        setIsImporting(true);

        try {
            const formData = new FormData();
            formData.append("file", importFile);
            formData.append("_token", getCsrfToken());

            const response = await fetch(
                `/praktikum/${praktikumId}/tugas/${tugas.id}/import-nilai`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setIsImportModalOpen(false);
                setImportFile(null);
                
                window.location.reload();
            } else {
                toast.error(result.message);
                if (result.errors) {
                    result.errors.forEach((error) => {
                        toast.error(error);
                    });
                }
            }
        } catch (error) {
            console.error("Error importing nilai:", error);
            toast.error(
                "Terjadi kesalahan saat mengimport nilai: " + error.message,
            );
        } finally {
            setIsImporting(false);
        }
    };

    
    React.useEffect(() => {
        const filtered = normalizedSubmissions.filter((submission) => {
            const praktikanName =
                submission.praktikan?.nama ||
                submission.praktikan?.user?.name ||
                "";
            const praktikanNim = submission.praktikan?.nim || "";
            const matchesSearch =
                praktikanName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                praktikanNim.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" || submission.status === filterStatus;
            return matchesSearch && matchesStatus && !!submission.praktikan_id;
        });
        setFilteredSubmissions(filtered);

        const filteredNon = normalizedNonSubmittedPraktikans.filter(
            (student) => {
                const praktikanName =
                    student.praktikan?.nama ||
                    student.praktikan?.user?.name ||
                    "";
                const praktikanNim = student.praktikan?.nim || "";
                const matchesSearch =
                    praktikanName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    praktikanNim
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());
                
                const matchesStatus =
                    filterStatus === "all" || filterStatus === "belum_kumpul";
                return matchesSearch && matchesStatus && !!student.praktikan_id;
            },
        );
        setFilteredNonSubmitted(filteredNon);
        setCurrentPage(1);
    }, [
        searchTerm,
        filterStatus,
        normalizedSubmissions,
        normalizedNonSubmittedPraktikans,
    ]);

    
    React.useEffect(() => {
        console.log("Raw submissions data:", submissions);
        console.log("Raw nonSubmittedPraktikans data:", nonSubmittedPraktikans);
        if (normalizedSubmissions && normalizedSubmissions.length > 0) {
            console.log(
                "First submission praktikan_id:",
                normalizedSubmissions[0].praktikan_id,
                "Length:",
                normalizedSubmissions[0].praktikan_id?.length,
            );
        }
        if (
            normalizedNonSubmittedPraktikans &&
            normalizedNonSubmittedPraktikans.length > 0
        ) {
            console.log(
                "First non-submitted praktikan_id:",
                normalizedNonSubmittedPraktikans[0].praktikan_id,
                "Length:",
                normalizedNonSubmittedPraktikans[0].praktikan_id?.length,
            );
        }
    }, [normalizedSubmissions, normalizedNonSubmittedPraktikans]);

    
    React.useEffect(() => {
        if (tugas.komponen_rubriks && tugas.komponen_rubriks.length > 0) {
            const initialData = {};

            
            normalizedSubmissions.forEach((submission) => {
                if (!submission.praktikan_id) return;
                initialData[submission.praktikan_id] = {};
                tugas.komponen_rubriks.forEach((komponen) => {
                    const existingNilai = submission.nilai_rubriks?.find(
                        (nr) => nr.komponen_rubrik_id === komponen.id,
                    );
                    initialData[submission.praktikan_id][komponen.id] = {
                        nilai: existingNilai?.nilai || "",
                    };
                });
            });

            
            normalizedNonSubmittedPraktikans.forEach((student) => {
                if (!student.praktikan_id) return;
                initialData[student.praktikan_id] = {};
                tugas.komponen_rubriks.forEach((komponen) => {
                    initialData[student.praktikan_id][komponen.id] = {
                        nilai: "",
                    };
                });
            });

            setInlineNilaiData(initialData);
        }
    }, [
        tugas.komponen_rubriks,
        normalizedSubmissions,
        normalizedNonSubmittedPraktikans,
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case "dikumpulkan":
                return "text-blue-600 bg-blue-100";
            case "dinilai":
                return "text-green-600 bg-green-100";
            case "terlambat":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "dikumpulkan":
                return <Clock className="w-4 h-4" />;
            case "dinilai":
                return <CheckCircle className="w-4 h-4" />;
            case "terlambat":
                return <XCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setGradeForm({
            nilai: submission.nilai || "",
            feedback: submission.feedback || "",
        });
        setIsGradeModalOpen(true);
    };

    const closeGradeModal = () => {
        setIsGradeModalOpen(false);
        setSelectedSubmission(null);
        setGradeForm({ nilai: "", feedback: "" });
    };

    const openRubrikGrading = (submission) => {
        setSelectedSubmission(submission);
        setIsRubrikGradingOpen(true);
    };

    const closeRubrikGrading = () => {
        setIsRubrikGradingOpen(false);
        setSelectedSubmission(null);
    };

    const openNilaiTambahanModal = () => {
        setIsNilaiTambahanOpen(true);
    };

    const openDirectGrading = (student) => {
        const praktikanId = resolvePraktikanId(student);
        if (!praktikanId) {
            toast.error("ID praktikan tidak valid");
            return;
        }

        
        const dummySubmission = {
            id: null,
            praktikan_id: praktikanId,
            praktikan: student.praktikan,
            nilai: null,
            feedback: null,
        };
        setSelectedSubmission(dummySubmission);
        setIsRubrikGradingOpen(true);
    };

    const openManageNilaiTambahan = (submission) => {
        setSelectedSubmission(submission);
        setIsManageNilaiTambahanOpen(true);
    };

    const handleRubrikGradeSaved = () => {
        router.reload();
        toast.success("Nilai rubrik berhasil disimpan");
    };

    const handleNilaiTambahanSaved = () => {
        router.reload();
        toast.success("Nilai tambahan berhasil diberikan");
    };

    const handleCatatanHover = (praktikanId, catatan) => {
        if (catatan && catatan.trim()) {
            setHoveredCatatan({ praktikanId, catatan });
        }
    };

    const handleCatatanLeave = () => {
        setHoveredCatatan(null);
    };

    const openPdfViewer = (submission, fileItem) => {
        const fullFileName = fileItem.data.split("/").pop();
        const fileUrl = `/praktikum/pengumpulan/download/${encodeURIComponent(
            fullFileName,
        )}`;
        setSelectedPdfSubmission({
            url: fileUrl,
            filename:
                fileItem.original_name || fullFileName.replace(/^\d+_/, ""),
            submission: submission,
        });
        setIsPdfViewerOpen(true);
    };

    const toggleColumn = (column) => {
        setVisibleColumns((prev) => ({
            ...prev,
            [column]: !prev[column],
        }));
    };

    const formatSubmissionTime = (submission) => {
        if (!submission.submitted_at) return "-";
        const date = new Date(submission.submitted_at);
        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleInlineNilaiChange = (praktikanId, komponenId, field, value) => {
        if (!praktikanId) return;

        if (!isEditMode && editingRow !== praktikanId) return;

        setInlineNilaiData((prev) => ({
            ...prev,
            [praktikanId]: {
                ...prev[praktikanId],
                [komponenId]: {
                    ...prev[praktikanId][komponenId],
                    [field]: value,
                },
            },
        }));

        
        const key = `${praktikanId}-${komponenId}`;
        setModifiedData((prev) => new Set([...prev, key]));
    };

    const toggleRowEdit = (praktikanId) => {
        console.log("toggleRowEdit called with praktikanId:", praktikanId);
        console.log("Current editingRow:", editingRow);
        if (editingRow === praktikanId) {
            setEditingRow(null);
            console.log("Set editingRow to null");
        } else {
            setEditingRow(praktikanId);
            console.log("Set editingRow to:", praktikanId);
        }
    };

    const calculateTotalForPraktikan = (praktikanId) => {
        let total = 0;
        let totalBobot = 0;

        tugas.komponen_rubriks?.forEach((komponen) => {
            const nilai = inlineNilaiData[praktikanId]?.[komponen.id]?.nilai;

            if (nilai && nilai !== "" && !isNaN(parseFloat(nilai))) {
                const nilaiFloat = parseFloat(nilai);
                const maxFloat = parseFloat(komponen.nilai_maksimal);
                const bobotFloat = parseFloat(komponen.bobot);

                if (nilaiFloat >= 0 && maxFloat > 0 && bobotFloat >= 0) {
                    const nilaiCapped = Math.min(nilaiFloat, maxFloat);
                    const persentaseNilai = (nilaiCapped / maxFloat) * 100;
                    const kontribusi = (persentaseNilai * bobotFloat) / 100;

                    total += kontribusi;
                    totalBobot += bobotFloat;
                }
            }
        });

        return totalBobot > 0 ? total.toFixed(2) : "0.00";
    };

    const handleSaveAllNilai = async () => {
        setIsSaving(true);

        try {
            
            console.log("Modified data:", modifiedData);
            console.log("Inline nilai data:", inlineNilaiData);

            
            const modifiedPraktikans = new Set();
            modifiedData.forEach((key) => {
                const separatorIndex = key.lastIndexOf("-");
                const praktikanId =
                    separatorIndex > 0 ? key.substring(0, separatorIndex) : key;
                const normalizedPraktikanId = normalizeIdValue(praktikanId);
                if (normalizedPraktikanId) {
                    modifiedPraktikans.add(normalizedPraktikanId);
                }
            });

            console.log("Modified praktikans:", modifiedPraktikans);

            
            if (modifiedPraktikans.size === 0) {
                console.log(
                    "No modified data found, using all data with values",
                );
                const allPraktikans = new Set();
                Object.keys(inlineNilaiData).forEach((praktikanId) => {
                    const hasValues = Object.values(
                        inlineNilaiData[praktikanId] || {},
                    ).some(
                        (komponenData) =>
                            komponenData.nilai !== undefined &&
                            komponenData.nilai !== null &&
                            komponenData.nilai !== "",
                    );
                    if (hasValues) {
                        allPraktikans.add(praktikanId);
                    }
                });
                modifiedPraktikans.clear();
                allPraktikans.forEach((id) => modifiedPraktikans.add(id));
            }

            
            if (modifiedPraktikans.size === 0) {
                console.log(
                    "Still no data, using all praktikans from submissions and non-submitted",
                );
                [
                    ...normalizedSubmissions,
                    ...normalizedNonSubmittedPraktikans,
                ].forEach((item) => {
                    if (item.praktikan_id) {
                        modifiedPraktikans.add(String(item.praktikan_id));
                    }
                });
            }

            const requestData = {
                tugas_id: tugas.id,
                matrix_data: Array.from(modifiedPraktikans)
                    .map((praktikanId) => {
                        const normalizedPraktikanId =
                            normalizeIdValue(praktikanId);
                        const submission = normalizedSubmissions?.find(
                            (s) =>
                                String(s.praktikan_id) ===
                                String(normalizedPraktikanId),
                        );
                        const nonSubmitted =
                            normalizedNonSubmittedPraktikans?.find(
                                (ns) =>
                                    String(ns.praktikan_id) ===
                                    String(normalizedPraktikanId),
                            );

                        
                        if (!normalizedPraktikanId) {
                            console.error("Invalid praktikan_id:", praktikanId);
                            return null;
                        }

                        const nilaiRubrik = tugas.komponen_rubriks
                            .filter((komponen) => {
                                
                                if (
                                    modifiedData.has(
                                        `${normalizedPraktikanId}-${komponen.id}`,
                                    )
                                ) {
                                    return true;
                                }
                                
                                return true;
                            })
                            .map((komponen) => ({
                                komponen_rubrik_id: komponen.id,
                                nilai: parseFloat(
                                    inlineNilaiData[normalizedPraktikanId]?.[
                                        komponen.id
                                    ]?.nilai || 0,
                                ),
                                catatan: "",
                            }));

                        console.log(
                            `Praktikan ${normalizedPraktikanId} nilai rubrik:`,
                            nilaiRubrik,
                        );

                        
                        if (nilaiRubrik.length === 0) {
                            console.warn(
                                `No nilai rubrik for praktikan ${normalizedPraktikanId}`,
                            );
                            return null;
                        }

                        return {
                            praktikan_id: normalizedPraktikanId,
                            pengumpulan_tugas_id: submission?.id || null,
                            nilai_rubrik: nilaiRubrik,
                            feedback:
                                feedbackData[submission?.id] !== undefined
                                    ? feedbackData[submission.id]
                                    : submission?.feedback ||
                                      nonSubmitted?.feedback ||
                                      "",
                        };
                    })
                    .filter((data) => data !== null),
            };

            console.log("Request data:", requestData);
            console.log("Tugas ID:", tugas.id);
            console.log("Tugas ID type:", typeof tugas.id);
            console.log("Tugas object:", tugas);
            console.log("Tugas ID yang akan dikirim:", tugas.id);
            console.log("Submissions:", normalizedSubmissions);
            console.log(
                "Non-submitted praktikans:",
                normalizedNonSubmittedPraktikans,
            );
            console.log("Modified praktikans:", Array.from(modifiedPraktikans));
            console.log(
                "Praktikan IDs in submissions:",
                normalizedSubmissions?.map((s) => ({
                    id: s.praktikan_id,
                    length: s.praktikan_id?.length,
                })),
            );
            console.log(
                "Praktikan IDs in non-submitted:",
                normalizedNonSubmittedPraktikans?.map((ns) => ({
                    id: ns.praktikan_id,
                    length: ns.praktikan_id?.length,
                })),
            );

            
            console.log(
                "Matrix data yang akan dikirim:",
                requestData.matrix_data?.map((data) => ({
                    praktikan_id: data.praktikan_id,
                    praktikan_id_length: data.praktikan_id?.length,
                })),
            );

            
            const normalizedTugasId = normalizeIdValue(tugas.id);
            if (!normalizedTugasId) {
                console.error("Invalid tugas_id:", tugas.id);
                toast.error("ID tugas tidak valid");
                return;
            }
            requestData.tugas_id = normalizedTugasId;

            
            if (
                !requestData.matrix_data ||
                requestData.matrix_data.length === 0
            ) {
                console.warn("No matrix data to send");
                toast.error("Tidak ada data yang diubah untuk disimpan");
                return;
            }

            const response = await fetch("/praktikum/submission/matrix-grade", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    Accept: "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success("Semua nilai berhasil disimpan");
                setIsEditMode(false);
                setModifiedData(new Set()); 
            } else {
                const errorData = await response.json();
                console.error("Error saving matrix data:", errorData);

                const mainMessage =
                    errorData.message ||
                    "Terjadi kesalahan saat menyimpan nilai";
                toast.error(mainMessage);

                
                if (Array.isArray(errorData.results)) {
                    errorData.results
                        .filter((r) => !r.success && r.error)
                        .forEach((r) =>
                            toast.error(
                                `Praktikan ${r.praktikan_id?.slice(0, 8)}…: ${r.error}`,
                            ),
                        );
                } else if (errorData.errors) {
                    Object.values(errorData.errors)
                        .flat()
                        .forEach((e) => toast.error(e));
                }
            }
        } catch (error) {
            console.error("Error saving inline nilai:", error);
            toast.error("Terjadi kesalahan: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveIndividualNilai = async (praktikanId) => {
        const normalizedPraktikanId = normalizeIdValue(praktikanId);
        console.log(
            "handleSaveIndividualNilai called with praktikanId:",
            normalizedPraktikanId,
        );
        setSavingPraktikan(normalizedPraktikanId);

        try {
            const submission = normalizedSubmissions?.find(
                (s) => String(s.praktikan_id) === String(normalizedPraktikanId),
            );
            const nonSubmitted = normalizedNonSubmittedPraktikans?.find(
                (ns) =>
                    String(ns.praktikan_id) === String(normalizedPraktikanId),
            );

            
            if (!normalizedPraktikanId) {
                console.error("Invalid praktikan_id:", normalizedPraktikanId);
                toast.error("ID praktikan tidak valid");
                return;
            }

            const nilaiRubrik = tugas.komponen_rubriks
                .filter((komponen) => {
                    const nilai =
                        inlineNilaiData[normalizedPraktikanId]?.[komponen.id]
                            ?.nilai;
                    return (
                        nilai !== undefined && nilai !== null && nilai !== ""
                    );
                })
                .map((komponen) => ({
                    komponen_rubrik_id: komponen.id,
                    nilai: parseFloat(
                        inlineNilaiData[normalizedPraktikanId]?.[komponen.id]
                            ?.nilai || 0,
                    ),
                    catatan: "",
                }));

            
            if (nilaiRubrik.length === 0) {
                console.warn(
                    `No nilai rubrik for praktikan ${normalizedPraktikanId}`,
                );
                toast.error("Tidak ada nilai yang diubah untuk disimpan");
                return;
            }

            
            const normalizedTugasId = normalizeIdValue(tugas.id);
            if (!normalizedTugasId) {
                console.error("Invalid tugas_id:", tugas.id);
                toast.error("ID tugas tidak valid");
                return;
            }

            
            const feedbackValue = submission?.id
                ? feedbackData[submission.id] !== undefined
                    ? feedbackData[submission.id]
                    : submission?.feedback || ""
                : feedbackData[`non-submitted-${normalizedPraktikanId}`] !==
                    undefined
                  ? feedbackData[`non-submitted-${normalizedPraktikanId}`]
                  : nonSubmitted?.feedback || "";

            const requestData = {
                tugas_id: normalizedTugasId,
                matrix_data: [
                    {
                        praktikan_id: normalizedPraktikanId,
                        pengumpulan_tugas_id: submission?.id || null,
                        nilai_rubrik: nilaiRubrik,
                        feedback: feedbackValue,
                    },
                ],
            };

            console.log("Individual save request data:", requestData);
            console.log("Modified data before save:", modifiedData);
            console.log("Nilai rubrik length:", nilaiRubrik.length);
            console.log("Feedback data:", feedbackData);
            console.log("Feedback value:", feedbackValue);

            const response = await fetch("/praktikum/submission/matrix-grade", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    Accept: "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Individual save response:", result);
                toast.success("Nilai berhasil disimpan");
                setEditingRow(null);

                
                router.reload({
                    only: ["submissions", "nonSubmittedPraktikans"],
                });

                
                const newModifiedData = new Set(modifiedData);
                tugas.komponen_rubriks.forEach((komponen) => {
                    newModifiedData.delete(
                        `${normalizedPraktikanId}-${komponen.id}`,
                    );
                });
                setModifiedData(newModifiedData);
                console.log("Modified data after clear:", newModifiedData);
            } else {
                const errorData = await response.json();
                console.error("Error saving individual data:", errorData);

                const mainMessage =
                    errorData.message ||
                    "Terjadi kesalahan saat menyimpan nilai";
                toast.error(mainMessage);

                
                if (Array.isArray(errorData.results)) {
                    errorData.results
                        .filter((r) => !r.success && r.error)
                        .forEach((r) => toast.error(r.error));
                } else if (errorData.errors) {
                    Object.values(errorData.errors)
                        .flat()
                        .forEach((e) => toast.error(e));
                }
            }
        } catch (error) {
            console.error("Error saving individual nilai:", error);
            toast.error("Terjadi kesalahan: " + error.message);
        } finally {
            setSavingPraktikan(null);
        }
    };

    
    const totalSubmissions = filteredSubmissions?.length || 0;
    const totalNonSubmitted = filteredNonSubmitted?.length || 0;
    const totalItems =
        activeTab === "submitted"
            ? totalSubmissions
            : activeTab === "not-submitted"
              ? totalNonSubmitted
              : totalSubmissions + totalNonSubmitted;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(currentPage, totalPages);

    let pagedSubmissions = [];
    let pagedNonSubmitted = [];
    if (activeTab === "submitted") {
        const start = (safePage - 1) * perPage;
        pagedSubmissions = (filteredSubmissions || []).slice(
            start,
            start + perPage,
        );
    } else if (activeTab === "not-submitted") {
        const start = (safePage - 1) * perPage;
        pagedNonSubmitted = (filteredNonSubmitted || []).slice(
            start,
            start + perPage,
        );
    } else {
        const start = (safePage - 1) * perPage;
        const end = start + perPage;
        pagedSubmissions = (filteredSubmissions || []).slice(
            Math.max(0, start),
            Math.min(totalSubmissions, end),
        );
        const remaining = perPage - pagedSubmissions.length;
        const nonStart = Math.max(0, start - totalSubmissions);
        pagedNonSubmitted = (filteredNonSubmitted || []).slice(
            nonStart,
            nonStart + remaining,
        );
    }
    

    return (
        <DashboardLayout>
            <Head title={`Pengumpulan Tugas - ${tugas.judul_tugas}`} />

            <div className="bg-white shadow">
                <div className="px-4 py-5 sm:p-6">
                    
                    <div className="mb-4">
                        <Link
                            href={
                                praktikumId
                                    ? route("praktikum.tugas.index", {
                                          praktikum: praktikumId,
                                          ...(kelasId
                                              ? {
                                                    kelas_id: kelasId,
                                                    context_kelas_id: kelasId,
                                                }
                                              : {}),
                                      })
                                    : "/praktikum"
                            }
                            className="inline-flex items-center px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali ke Daftar Tugas
                        </Link>
                    </div>

                    
                    {(!tugas.komponen_rubriks ||
                        tugas.komponen_rubriks.length === 0) && (
                        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm text-amber-800">
                                    Rubrik Penilaian Belum Dibuat
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Nilai tidak dapat diberikan sebelum rubrik
                                    penilaian dikonfigurasi. Silakan buat rubrik
                                    terlebih dahulu melalui tombol{" "}
                                    <strong>Kelola Komponen Rubrik</strong>.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div className="sm:flex sm:items-center">
                            <div className="flex-shrink-0">
                                <BookOpen className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="mt-4 sm:mt-0 sm:ml-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Pengumpulan Tugas: {tugas.judul_tugas}
                                </h2>
                                <div className="text-gray-600 text-sm">
                                    <p>
                                        <strong>Mata Kuliah:</strong>{" "}
                                        {tugas.praktikum?.mata_kuliah || "N/A"}
                                    </p>
                                    <p>
                                        <strong>Deadline:</strong>{" "}
                                        {new Date(
                                            tugas.deadline,
                                        ).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            <div className="flex space-x-2">
                                {canUpdate && (
                                    <button
                                        onClick={() =>
                                            router.visit(
                                                `/praktikum/tugas/${tugas.id}/komponen`,
                                            )
                                        }
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Kelola Komponen Rubrik</span>
                                    </button>
                                )}
                                {canGrade &&
                                    tugas.komponen_rubriks &&
                                    tugas.komponen_rubriks.length > 0 && (
                                        <button
                                            onClick={() =>
                                                setIsEditMode(!isEditMode)
                                            }
                                            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                                                isEditMode
                                                    ? "bg-red-600 text-white hover:bg-red-700"
                                                    : "bg-purple-600 text-white hover:bg-purple-700"
                                            }`}
                                        >
                                            {isEditMode ? (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    <span>
                                                        Batalkan Input Nilai
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Edit className="w-4 h-4" />
                                                    <span>
                                                        Aktifkan Input Nilai
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                {canGrade && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setIsNilaiTambahanOpen(true)
                                            }
                                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Nilai Tambahan</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                        >
                                            <FileSpreadsheet className="w-4 h-4" />
                                            <span>Download Template</span>
                                        </button>
                                        <button
                                            onClick={() =>
                                                setIsImportModalOpen(true)
                                            }
                                            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Import Nilai</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">
                        Total Pengumpulan
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">
                        Sudah Dinilai
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(
                            (s) => s.status === "dinilai",
                        ).length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">
                        Belum Dinilai
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(
                            (s) =>
                                s.status === "dikumpulkan" ||
                                s.status === "terlambat",
                        ).length || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-gray-600 text-sm font-medium">
                        Terlambat
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {filteredSubmissions?.filter(
                            (s) => s.status === "terlambat",
                        ).length || 0}
                    </div>
                </div>
            </div>

            
            {isEditMode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
                        <p className="text-green-800">
                            <strong>Mode Edit Aktif!</strong> Anda dapat mengisi
                            nilai untuk setiap komponen rubrik. Klik "Simpan
                            Semua Nilai" untuk menyimpan perubahan.
                        </p>
                    </div>
                </div>
            )}

            
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-wrap items-center gap-3">
                    
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="text"
                            placeholder="Cari nama praktikan atau NIM..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="min-w-[160px] px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">Semua Status</option>
                        <option value="dikumpulkan">Dikumpulkan</option>
                        <option value="dinilai">Sudah Dinilai</option>
                        <option value="terlambat">Terlambat</option>
                        <option value="belum_kumpul">Belum Kumpul</option>
                    </select>

                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                        <span>Tampilkan</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="min-w-[72px] px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                            {[10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span>per halaman</span>
                    </div>

                    
                    <button
                        onClick={() =>
                            setShowColumnSelector(!showColumnSelector)
                        }
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        {showColumnSelector
                            ? "Sembunyikan Kolom"
                            : "Atur Kolom"}
                    </button>
                </div>

                {showColumnSelector && (
                    <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                                Pilih Kolom yang Ditampilkan
                            </h4>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() =>
                                        setVisibleColumns({
                                            praktikan: true,
                                            status: true,
                                            file: true,
                                            catatan: true,
                                            waktu: true,
                                            komponen: true,
                                            total: true,
                                            feedback: true,
                                            nilai_tambahan: true,
                                            aksi: true,
                                        })
                                    }
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() =>
                                        setVisibleColumns({
                                            praktikan: true,
                                            status: true,
                                            file: false,
                                            catatan: false,
                                            waktu: false,
                                            komponen: true,
                                            total: true,
                                            feedback: false,
                                            nilai_tambahan: false,
                                            aksi: true,
                                        })
                                    }
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                    Minimal
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {[
                                { key: "praktikan", label: "Praktikan" },
                                { key: "status", label: "Status" },
                                { key: "file", label: "File" },
                                { key: "catatan", label: "Catatan" },
                                { key: "waktu", label: "Waktu" },
                                { key: "komponen", label: "Komponen" },
                                { key: "total", label: "Total" },
                                { key: "feedback", label: "Feedback" },
                                {
                                    key: "nilai_tambahan",
                                    label: "Nilai Tambahan",
                                },
                                { key: "aksi", label: "Aksi" },
                            ].map((column) => (
                                <label
                                    key={column.key}
                                    className="flex items-center space-x-2 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns[column.key]}
                                        onChange={() =>
                                            toggleColumn(column.key)
                                        }
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {column.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "all"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Semua (
                        {(filteredSubmissions?.length || 0) +
                            (filteredNonSubmitted?.length || 0)}
                        )
                    </button>
                    <button
                        onClick={() => setActiveTab("submitted")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "submitted"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Sudah Kumpul ({filteredSubmissions?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab("not-submitted")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "not-submitted"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Belum Kumpul ({filteredNonSubmitted?.length || 0})
                    </button>
                </nav>
            </div>

            
            <div className="bg-white shadow rounded-lg">
                
                <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {visibleColumns.praktikan && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Praktikan
                                        </th>
                                    )}
                                    {visibleColumns.status && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    )}
                                    {visibleColumns.file && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            File
                                        </th>
                                    )}
                                    {visibleColumns.catatan && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Catatan
                                        </th>
                                    )}
                                    {visibleColumns.waktu && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Waktu Pengumpulan
                                        </th>
                                    )}

                                    {tugas.komponen_rubriks &&
                                    tugas.komponen_rubriks.length > 0 ? (
                                        <>
                                            {visibleColumns.komponen &&
                                                tugas.komponen_rubriks.map(
                                                    (komponen) => (
                                                        <th
                                                            key={komponen.id}
                                                            className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            <div className="text-center">
                                                                <div className="font-medium">
                                                                    {
                                                                        komponen.nama_komponen
                                                                    }
                                                                </div>
                                                                <div className="flex justify-center mt-1">
                                                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                                                                        {parseFloat(
                                                                            komponen.bobot,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </th>
                                                    ),
                                                )}
                                            {visibleColumns.total && (
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                            )}
                                            {visibleColumns.feedback && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Feedback
                                                </th>
                                            )}
                                        </>
                                    ) : (
                                        visibleColumns.komponen && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nilai
                                            </th>
                                        )
                                    )}
                                    {visibleColumns.nilai_tambahan && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nilai Tambahan
                                        </th>
                                    )}
                                    {visibleColumns.aksi && canGrade && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                
                                {(activeTab === "submitted" ||
                                    activeTab === "all") &&
                                    pagedSubmissions?.length > 0 &&
                                    pagedSubmissions.map((submission) => (
                                        <tr
                                            key={submission.id}
                                            className="hover:bg-gray-50"
                                        >
                                            {visibleColumns.praktikan && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {submission
                                                                .praktikan
                                                                ?.nama ||
                                                                submission
                                                                    .praktikan
                                                                    ?.user
                                                                    ?.name ||
                                                                "N/A"}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {submission
                                                                .praktikan
                                                                ?.nim || "N/A"}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                            submission.status,
                                                        )}`}
                                                    >
                                                        {getStatusIcon(
                                                            submission.status,
                                                        )}
                                                        <span className="ml-1">
                                                            {submission.status ===
                                                            "dikumpulkan"
                                                                ? "Dikumpulkan"
                                                                : submission.status ===
                                                                    "dinilai"
                                                                  ? "Sudah Dinilai"
                                                                  : submission.status ===
                                                                      "terlambat"
                                                                    ? "Terlambat"
                                                                    : submission.status}
                                                        </span>
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.file && (
                                                <td className="px-6 py-4">
                                                    {submission.file_pengumpulan ? (
                                                        (() => {
                                                            try {
                                                                const submissionData =
                                                                    JSON.parse(
                                                                        submission.file_pengumpulan,
                                                                    );

                                                                
                                                                if (
                                                                    Array.isArray(
                                                                        submissionData,
                                                                    ) &&
                                                                    submissionData.length >
                                                                        0
                                                                ) {
                                                                    if (
                                                                        typeof submissionData[0] ===
                                                                            "object" &&
                                                                        submissionData[0]
                                                                            .type
                                                                    ) {
                                                                        
                                                                        return (
                                                                            <div className="space-y-1">
                                                                                {submissionData.map(
                                                                                    (
                                                                                        item,
                                                                                        index,
                                                                                    ) => {
                                                                                        if (
                                                                                            item.type ===
                                                                                            "file"
                                                                                        ) {
                                                                                            const fullFileName =
                                                                                                item.data
                                                                                                    .split(
                                                                                                        "/",
                                                                                                    )
                                                                                                    .pop();
                                                                                            const displayFileName =
                                                                                                fullFileName.replace(
                                                                                                    /^\d+_/,
                                                                                                    "",
                                                                                                );
                                                                                            const isPdf =
                                                                                                displayFileName
                                                                                                    .toLowerCase()
                                                                                                    .endsWith(
                                                                                                        ".pdf",
                                                                                                    );
                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="flex items-center space-x-2"
                                                                                                >
                                                                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                                                                    {isPdf && (
                                                                                                        <Eye
                                                                                                            className="w-4 h-4 text-green-600 hover:text-green-800 cursor-pointer"
                                                                                                            onClick={() =>
                                                                                                                openPdfViewer(
                                                                                                                    submission,
                                                                                                                    item,
                                                                                                                )
                                                                                                            }
                                                                                                            title={`Lihat PDF: ${displayFileName}`}
                                                                                                        />
                                                                                                    )}
                                                                                                    <Download
                                                                                                        className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer"
                                                                                                        onClick={() =>
                                                                                                            window.open(
                                                                                                                `/praktikum/pengumpulan/download/${encodeURIComponent(
                                                                                                                    fullFileName,
                                                                                                                )}`,
                                                                                                                "_blank",
                                                                                                            )
                                                                                                        }
                                                                                                        title={`Download: ${displayFileName}`}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        } else if (
                                                                                            item.type ===
                                                                                            "link"
                                                                                        ) {
                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="flex items-center space-x-2"
                                                                                                >
                                                                                                    <FileText className="w-4 h-4 text-green-600" />
                                                                                                    <a
                                                                                                        href={
                                                                                                            item.data
                                                                                                        }
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="text-sm text-green-600 hover:text-green-800 hover:underline truncate max-w-xs"
                                                                                                        title={
                                                                                                            item.data
                                                                                                        }
                                                                                                    >
                                                                                                        {item.original_name ||
                                                                                                            "Link"}
                                                                                                    </a>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        return null;
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        
                                                                        return (
                                                                            <div className="space-y-1">
                                                                                {submissionData.map(
                                                                                    (
                                                                                        filePath,
                                                                                        index,
                                                                                    ) => {
                                                                                        const fullFileName =
                                                                                            filePath
                                                                                                .split(
                                                                                                    "/",
                                                                                                )
                                                                                                .pop();
                                                                                        const displayFileName =
                                                                                            fullFileName.replace(
                                                                                                /^\d+_/,
                                                                                                "",
                                                                                            );
                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                className="flex items-center space-x-2"
                                                                                            >
                                                                                                <FileText className="w-4 h-4 text-blue-600" />
                                                                                                <a
                                                                                                    href={`/praktikum/pengumpulan/download/${encodeURIComponent(
                                                                                                        fullFileName,
                                                                                                    )}`}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                                                                                    title={
                                                                                                        displayFileName
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        displayFileName
                                                                                                    }
                                                                                                </a>
                                                                                                <Download
                                                                                                    className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer"
                                                                                                    onClick={() =>
                                                                                                        window.open(
                                                                                                            `/praktikum/pengumpulan/download/${encodeURIComponent(
                                                                                                                fullFileName,
                                                                                                            )}`,
                                                                                                            "_blank",
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                }
                                                            } catch (e) {
                                                                
                                                                const fullFileName =
                                                                    submission.file_pengumpulan
                                                                        .split(
                                                                            "/",
                                                                        )
                                                                        .pop();
                                                                const displayFileName =
                                                                    fullFileName.replace(
                                                                        /^\d+_/,
                                                                        "",
                                                                    );
                                                                return (
                                                                    <div className="flex items-center space-x-2">
                                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                                        <a
                                                                            href={`/praktikum/pengumpulan/download/${fullFileName}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate max-w-xs"
                                                                            title={
                                                                                displayFileName
                                                                            }
                                                                        >
                                                                            {
                                                                                displayFileName
                                                                            }
                                                                        </a>
                                                                        <Download
                                                                            className="w-4 h-4 text-gray-500 hover:text-blue-600 cursor-pointer"
                                                                            onClick={() =>
                                                                                window.open(
                                                                                    `/praktikum/pengumpulan/download/${fullFileName}`,
                                                                                    "_blank",
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <span className="text-sm text-gray-500">
                                                                    Tidak ada
                                                                    data
                                                                </span>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-sm text-gray-500">
                                                            Tidak ada file
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.catatan && (
                                                <td className="px-6 py-4 text-sm font-medium max-w-xs relative">
                                                    <div
                                                        className="truncate cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                                        onMouseEnter={() =>
                                                            handleCatatanHover(
                                                                submission.praktikan_id,
                                                                submission.catatan,
                                                            )
                                                        }
                                                        onMouseLeave={
                                                            handleCatatanLeave
                                                        }
                                                    >
                                                        {submission.catatan ||
                                                            "-"}
                                                    </div>
                                                    {hoveredCatatan &&
                                                        hoveredCatatan.praktikanId ===
                                                            submission.praktikan_id && (
                                                            <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 whitespace-pre-wrap break-words">
                                                                <div className="font-medium mb-1">
                                                                    Catatan:
                                                                </div>
                                                                <div>
                                                                    {
                                                                        hoveredCatatan.catatan
                                                                    }
                                                                </div>
                                                                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                            </div>
                                                        )}
                                                </td>
                                            )}
                                            {visibleColumns.waktu && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatSubmissionTime(
                                                        submission,
                                                    )}
                                                </td>
                                            )}
                                            {tugas.komponen_rubriks &&
                                            tugas.komponen_rubriks.length >
                                                0 ? (
                                                <>
                                                    {visibleColumns.komponen &&
                                                        tugas.komponen_rubriks.map(
                                                            (komponen) => (
                                                                <td
                                                                    key={
                                                                        komponen.id
                                                                    }
                                                                    className="px-2 py-2"
                                                                >
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            inlineNilaiData[
                                                                                submission
                                                                                    .praktikan_id
                                                                            ]?.[
                                                                                komponen
                                                                                    .id
                                                                            ]
                                                                                ?.nilai ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const value =
                                                                                e
                                                                                    .target
                                                                                    .value;
                                                                            const maxValue =
                                                                                parseFloat(
                                                                                    komponen.nilai_maksimal,
                                                                                );

                                                                            
                                                                            if (
                                                                                parseFloat(
                                                                                    value,
                                                                                ) >
                                                                                maxValue +
                                                                                    0.01
                                                                            ) {
                                                                                toast.warning(
                                                                                    `Nilai tidak boleh melebihi ${maxValue}`,
                                                                                );
                                                                                return;
                                                                            }

                                                                            handleInlineNilaiChange(
                                                                                submission.praktikan_id,
                                                                                komponen.id,
                                                                                "nilai",
                                                                                value,
                                                                            );
                                                                        }}
                                                                        className={`w-16 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                            isEditMode ||
                                                                            editingRow ===
                                                                                submission.praktikan_id
                                                                                ? "border-gray-300 focus:border-blue-500"
                                                                                : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                                                        }`}
                                                                        min="0"
                                                                        max={
                                                                            komponen.nilai_maksimal
                                                                        }
                                                                        step="0.1"
                                                                        placeholder="0"
                                                                        disabled={
                                                                            !(
                                                                                isEditMode ||
                                                                                editingRow ===
                                                                                    submission.praktikan_id
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ),
                                                        )}
                                                    {visibleColumns.total && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {calculateTotalForPraktikan(
                                                                    submission.praktikan_id,
                                                                )}
                                                                %
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.feedback && (
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditMode ||
                                                            editingRow ===
                                                                submission.praktikan_id ? (
                                                                <textarea
                                                                    value={
                                                                        feedbackData[
                                                                            submission
                                                                                .id
                                                                        ] !==
                                                                        undefined
                                                                            ? feedbackData[
                                                                                  submission
                                                                                      .id
                                                                              ]
                                                                            : submission.feedback ||
                                                                              ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        setFeedbackData(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [submission.id]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }),
                                                                        );
                                                                    }}
                                                                    placeholder="Masukkan feedback..."
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    rows="2"
                                                                />
                                                            ) : (
                                                                <div className="text-sm text-gray-900">
                                                                    {feedbackData[
                                                                        submission
                                                                            .id
                                                                    ] !==
                                                                    undefined
                                                                        ? feedbackData[
                                                                              submission
                                                                                  .id
                                                                          ]
                                                                        : submission.feedback ||
                                                                          "-"}
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {submission.nilai
                                                            ? parseFloat(
                                                                  submission.nilai,
                                                              ).toFixed(1)
                                                            : submission.total_nilai_rubrik
                                                              ? parseFloat(
                                                                    submission.total_nilai_rubrik,
                                                                ).toFixed(1)
                                                              : "Belum dinilai"}
                                                    </span>
                                                </td>
                                            )}

                                            {visibleColumns.nilai_tambahan && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {submission.has_nilai_tambahan ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-green-600">
                                                                    +
                                                                    {parseFloat(
                                                                        submission.total_nilai_tambahan ||
                                                                            0,
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Total:{" "}
                                                                    {parseFloat(
                                                                        submission.total_nilai_with_bonus ||
                                                                            0,
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    openManageNilaiTambahan(
                                                                        submission,
                                                                    )
                                                                }
                                                                className="p-1 text-blue-600 hover:text-blue-800"
                                                                title="Kelola nilai tambahan"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                            )}

                                            {visibleColumns.aksi &&
                                                canGrade && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            {tugas.komponen_rubriks &&
                                                            tugas
                                                                .komponen_rubriks
                                                                .length > 0 ? (
                                                                <div className="flex space-x-1">
                                                                    {(() => {
                                                                        const shouldShowSave =
                                                                            isEditMode ||
                                                                            editingRow ===
                                                                                submission.praktikan_id;
                                                                        console.log(
                                                                            "Button condition check:",
                                                                            {
                                                                                isEditMode,
                                                                                editingRow,
                                                                                praktikanId:
                                                                                    submission.praktikan_id,
                                                                                shouldShowSave,
                                                                            },
                                                                        );
                                                                        return shouldShowSave;
                                                                    })() ? (
                                                                        <button
                                                                            onClick={() =>
                                                                                handleSaveIndividualNilai(
                                                                                    submission.praktikan_id,
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                savingPraktikan ===
                                                                                submission.praktikan_id
                                                                            }
                                                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                                        >
                                                                            {savingPraktikan ===
                                                                            submission.praktikan_id ? (
                                                                                <>
                                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                                    Simpan...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Save className="w-3 h-3 mr-1" />
                                                                                    Simpan
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() =>
                                                                                toggleRowEdit(
                                                                                    submission.praktikan_id,
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                        >
                                                                            <Edit className="w-3 h-3 mr-1" />
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        openGradeModal(
                                                                            submission,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Edit className="w-4 h-4 mr-1" />
                                                                    {submission.nilai
                                                                        ? "Edit Nilai"
                                                                        : "Beri Nilai"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                        </tr>
                                    ))}

                                
                                {(activeTab === "not-submitted" ||
                                    activeTab === "all") &&
                                    pagedNonSubmitted?.length > 0 &&
                                    pagedNonSubmitted.map((student) => (
                                        <tr
                                            key={student.praktikan_id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.praktikan
                                                            ?.nama ||
                                                            student.praktikan
                                                                ?.user?.name ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.praktikan
                                                            ?.nim || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                                    <XCircle className="w-4 h-4" />
                                                    <span className="ml-1">
                                                        Belum Mengumpulkan
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-500">
                                                    -
                                                </span>
                                            </td>
                                            {visibleColumns.waktu && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    -
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-sm font-medium max-w-xs relative">
                                                <div
                                                    className="truncate cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                                    onMouseEnter={() =>
                                                        handleCatatanHover(
                                                            student.praktikan_id,
                                                            "",
                                                        )
                                                    }
                                                    onMouseLeave={
                                                        handleCatatanLeave
                                                    }
                                                >
                                                    <span className="text-sm text-gray-500">
                                                        -
                                                    </span>
                                                </div>
                                                {hoveredCatatan &&
                                                    hoveredCatatan.praktikanId ===
                                                        student.praktikan_id && (
                                                        <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 whitespace-pre-wrap break-words">
                                                            <div className="font-medium mb-1">
                                                                Catatan:
                                                            </div>
                                                            <div className="text-gray-300">
                                                                Tidak ada
                                                                catatan
                                                            </div>
                                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                        </div>
                                                    )}
                                            </td>
                                            {tugas.komponen_rubriks &&
                                            tugas.komponen_rubriks.length >
                                                0 ? (
                                                <>
                                                    {visibleColumns.komponen &&
                                                        tugas.komponen_rubriks.map(
                                                            (komponen) => (
                                                                <td
                                                                    key={
                                                                        komponen.id
                                                                    }
                                                                    className="px-2 py-2"
                                                                >
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            inlineNilaiData[
                                                                                student
                                                                                    .praktikan_id
                                                                            ]?.[
                                                                                komponen
                                                                                    .id
                                                                            ]
                                                                                ?.nilai ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const value =
                                                                                e
                                                                                    .target
                                                                                    .value;
                                                                            const maxValue =
                                                                                parseFloat(
                                                                                    komponen.nilai_maksimal,
                                                                                );

                                                                            
                                                                            if (
                                                                                parseFloat(
                                                                                    value,
                                                                                ) >
                                                                                maxValue +
                                                                                    0.01
                                                                            ) {
                                                                                toast.warning(
                                                                                    `Nilai tidak boleh melebihi ${maxValue}`,
                                                                                );
                                                                                return;
                                                                            }

                                                                            handleInlineNilaiChange(
                                                                                student.praktikan_id,
                                                                                komponen.id,
                                                                                "nilai",
                                                                                value,
                                                                            );
                                                                        }}
                                                                        className={`w-16 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                            isEditMode ||
                                                                            editingRow ===
                                                                                student.praktikan_id
                                                                                ? "border-gray-300 focus:border-blue-500"
                                                                                : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                                                        }`}
                                                                        min="0"
                                                                        max={
                                                                            komponen.nilai_maksimal
                                                                        }
                                                                        step="0.1"
                                                                        placeholder="0"
                                                                        disabled={
                                                                            !(
                                                                                isEditMode ||
                                                                                editingRow ===
                                                                                    student.praktikan_id
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ),
                                                        )}
                                                    {visibleColumns.total && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {calculateTotalForPraktikan(
                                                                    student.praktikan_id,
                                                                )}
                                                                %
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.feedback && (
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditMode ||
                                                            editingRow ===
                                                                student.praktikan_id ? (
                                                                <textarea
                                                                    value={
                                                                        feedbackData[
                                                                            `non-submitted-${student.praktikan_id}`
                                                                        ] !==
                                                                        undefined
                                                                            ? feedbackData[
                                                                                  `non-submitted-${student.praktikan_id}`
                                                                              ]
                                                                            : student.feedback ||
                                                                              ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        setFeedbackData(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                [`non-submitted-${student.praktikan_id}`]:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            }),
                                                                        );
                                                                    }}
                                                                    placeholder="Masukkan feedback..."
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    rows="2"
                                                                />
                                                            ) : (
                                                                <div className="text-sm text-gray-900">
                                                                    {feedbackData[
                                                                        `non-submitted-${student.praktikan_id}`
                                                                    ] !==
                                                                    undefined
                                                                        ? feedbackData[
                                                                              `non-submitted-${student.praktikan_id}`
                                                                          ]
                                                                        : student.feedback ||
                                                                          "-"}
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-500">
                                                        -
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.nilai_tambahan && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {student.has_nilai_tambahan ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-green-600">
                                                                    +
                                                                    {parseFloat(
                                                                        student.total_nilai_tambahan ||
                                                                            0,
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Total:{" "}
                                                                    {parseFloat(
                                                                        student.total_nilai_with_bonus ||
                                                                            0,
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    openManageNilaiTambahan(
                                                                        {
                                                                            praktikan_id:
                                                                                student
                                                                                    .praktikan
                                                                                    ?.id,
                                                                            praktikan:
                                                                                student.praktikan,
                                                                        },
                                                                    )
                                                                }
                                                                className="p-1 text-blue-600 hover:text-blue-800"
                                                                title="Kelola nilai tambahan"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.aksi &&
                                                canGrade && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {isEditMode ||
                                                        editingRow ===
                                                            student.praktikan_id ? (
                                                            <button
                                                                onClick={() =>
                                                                    handleSaveIndividualNilai(
                                                                        student.praktikan_id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    savingPraktikan ===
                                                                    student.praktikan_id
                                                                }
                                                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                {savingPraktikan ===
                                                                student.praktikan_id ? (
                                                                    <>
                                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                                        Simpan...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="w-3 h-3 mr-1" />
                                                                        Simpan
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    toggleRowEdit(
                                                                        student.praktikan_id,
                                                                    )
                                                                }
                                                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                <Edit className="w-3 h-3 mr-1" />
                                                                Edit
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                        </tr>
                                    ))}

                                
                                {((activeTab === "submitted" &&
                                    filteredSubmissions?.length === 0) ||
                                    (activeTab === "not-submitted" &&
                                        filteredNonSubmitted?.length === 0) ||
                                    (activeTab === "all" &&
                                        filteredSubmissions?.length === 0 &&
                                        filteredNonSubmitted?.length ===
                                            0)) && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-12 text-center"
                                        >
                                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                {activeTab === "submitted"
                                                    ? "Belum ada pengumpulan"
                                                    : activeTab ===
                                                        "not-submitted"
                                                      ? "Semua praktikan sudah mengumpulkan"
                                                      : "Tidak ada data"}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {activeTab === "submitted"
                                                    ? "Praktikan belum mengumpulkan tugas ini."
                                                    : activeTab ===
                                                        "not-submitted"
                                                      ? "Tidak ada praktikan yang belum mengumpulkan tugas."
                                                      : "Tidak ada data untuk ditampilkan."}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                
                <div className="lg:hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Praktikan
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Catatan
                                    </th>
                                    {visibleColumns.waktu && (
                                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Waktu
                                        </th>
                                    )}
                                    {tugas.komponen_rubriks &&
                                        tugas.komponen_rubriks.length > 0 && (
                                            <>
                                                {tugas.komponen_rubriks.map(
                                                    (komponen) => (
                                                        <th
                                                            key={komponen.id}
                                                            className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            <div className="text-center">
                                                                <div className="font-medium text-xs">
                                                                    {
                                                                        komponen.nama_komponen
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    {parseFloat(
                                                                        komponen.bobot,
                                                                    )}
                                                                    %
                                                                </div>
                                                            </div>
                                                        </th>
                                                    ),
                                                )}
                                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Feedback
                                                </th>
                                            </>
                                        )}
                                    {canGrade && (
                                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                
                                {(activeTab === "submitted" ||
                                    activeTab === "all") &&
                                    pagedSubmissions?.length > 0 &&
                                    pagedSubmissions.map((submission) => (
                                        <tr
                                            key={submission.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-2">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">
                                                        {submission.praktikan
                                                            ?.nama ||
                                                            submission.praktikan
                                                                ?.user?.name ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {submission.praktikan
                                                            ?.nim || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <span
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        submission.status,
                                                    )}`}
                                                >
                                                    {getStatusIcon(
                                                        submission.status,
                                                    )}
                                                    <span className="ml-1">
                                                        {submission.status ===
                                                        "dikumpulkan"
                                                            ? "Dikumpulkan"
                                                            : submission.status ===
                                                                "dinilai"
                                                              ? "Dinilai"
                                                              : submission.status ===
                                                                  "terlambat"
                                                                ? "Terlambat"
                                                                : submission.status}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">
                                                {submission.file_pengumpulan ? (
                                                    (() => {
                                                        try {
                                                            const submissionData =
                                                                JSON.parse(
                                                                    submission.file_pengumpulan,
                                                                );

                                                            if (
                                                                Array.isArray(
                                                                    submissionData,
                                                                ) &&
                                                                submissionData.length >
                                                                    0
                                                            ) {
                                                                if (
                                                                    typeof submissionData[0] ===
                                                                        "object" &&
                                                                    submissionData[0]
                                                                        .type
                                                                ) {
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            {submissionData
                                                                                .slice(
                                                                                    0,
                                                                                    2,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        item,
                                                                                        index,
                                                                                    ) => {
                                                                                        if (
                                                                                            item.type ===
                                                                                            "file"
                                                                                        ) {
                                                                                            const fullFileName =
                                                                                                item.data
                                                                                                    .split(
                                                                                                        "/",
                                                                                                    )
                                                                                                    .pop();
                                                                                            const displayFileName =
                                                                                                fullFileName.replace(
                                                                                                    /^\d+_/,
                                                                                                    "",
                                                                                                );
                                                                                            const isPdf =
                                                                                                displayFileName
                                                                                                    .toLowerCase()
                                                                                                    .endsWith(
                                                                                                        ".pdf",
                                                                                                    );
                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="flex items-center space-x-1"
                                                                                                >
                                                                                                    <FileText className="w-3 h-3 text-blue-600" />
                                                                                                    {isPdf && (
                                                                                                        <Eye
                                                                                                            className="w-3 h-3 text-green-600 hover:text-green-800 cursor-pointer"
                                                                                                            onClick={() =>
                                                                                                                openPdfViewer(
                                                                                                                    submission,
                                                                                                                    item,
                                                                                                                )
                                                                                                            }
                                                                                                            title={`Lihat PDF: ${displayFileName}`}
                                                                                                        />
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        } else if (
                                                                                            item.type ===
                                                                                            "link"
                                                                                        ) {
                                                                                            return (
                                                                                                <div
                                                                                                    key={
                                                                                                        index
                                                                                                    }
                                                                                                    className="flex items-center space-x-1"
                                                                                                >
                                                                                                    <FileText className="w-3 h-3 text-green-600" />
                                                                                                    <a
                                                                                                        href={
                                                                                                            item.data
                                                                                                        }
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="text-xs text-green-600 hover:text-green-800 hover:underline truncate max-w-16"
                                                                                                        title={
                                                                                                            item.data
                                                                                                        }
                                                                                                    >
                                                                                                        {item.original_name ||
                                                                                                            "Link"}
                                                                                                    </a>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                        return null;
                                                                                    },
                                                                                )}
                                                                            {submissionData.length >
                                                                                2 && (
                                                                                <div className="text-xs text-gray-500">
                                                                                    +
                                                                                    {submissionData.length -
                                                                                        2}{" "}
                                                                                    file
                                                                                    lainnya
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            {submissionData
                                                                                .slice(
                                                                                    0,
                                                                                    2,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        filePath,
                                                                                        index,
                                                                                    ) => {
                                                                                        const fullFileName =
                                                                                            filePath
                                                                                                .split(
                                                                                                    "/",
                                                                                                )
                                                                                                .pop();
                                                                                        const displayFileName =
                                                                                            fullFileName.replace(
                                                                                                /^\d+_/,
                                                                                                "",
                                                                                            );
                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    index
                                                                                                }
                                                                                                className="flex items-center space-x-1"
                                                                                            >
                                                                                                <FileText className="w-3 h-3 text-blue-600" />
                                                                                                <a
                                                                                                    href={`/praktikum/pengumpulan/download/${encodeURIComponent(
                                                                                                        fullFileName,
                                                                                                    )}`}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate max-w-16"
                                                                                                    title={
                                                                                                        displayFileName
                                                                                                    }
                                                                                                >
                                                                                                    {displayFileName.length >
                                                                                                    10
                                                                                                        ? displayFileName.substring(
                                                                                                              0,
                                                                                                              10,
                                                                                                          ) +
                                                                                                          "..."
                                                                                                        : displayFileName}
                                                                                                </a>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            {submissionData.length >
                                                                                2 && (
                                                                                <div className="text-xs text-gray-500">
                                                                                    +
                                                                                    {submissionData.length -
                                                                                        2}{" "}
                                                                                    file
                                                                                    lainnya
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                            }
                                                        } catch (e) {
                                                            const fullFileName =
                                                                submission.file_pengumpulan
                                                                    .split("/")
                                                                    .pop();
                                                            const displayFileName =
                                                                fullFileName.replace(
                                                                    /^\d+_/,
                                                                    "",
                                                                );
                                                            return (
                                                                <div className="flex items-center space-x-1">
                                                                    <FileText className="w-3 h-3 text-blue-600" />
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <span className="text-xs text-gray-500">
                                                                Tidak ada data
                                                            </span>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-xs text-gray-500">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 max-w-24 relative">
                                                <div
                                                    className="text-xs text-gray-900 truncate cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                                    onMouseEnter={() =>
                                                        handleCatatanHover(
                                                            submission.praktikan_id,
                                                            submission.catatan,
                                                        )
                                                    }
                                                    onMouseLeave={
                                                        handleCatatanLeave
                                                    }
                                                >
                                                    {submission.catatan || "-"}
                                                </div>
                                                {hoveredCatatan &&
                                                    hoveredCatatan.praktikanId ===
                                                        submission.praktikan_id && (
                                                        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 whitespace-pre-wrap break-words">
                                                            <div className="font-medium mb-1">
                                                                Catatan:
                                                            </div>
                                                            <div>
                                                                {
                                                                    hoveredCatatan.catatan
                                                                }
                                                            </div>
                                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                        </div>
                                                    )}
                                            </td>
                                            {visibleColumns.waktu && (
                                                <td className="px-2 py-2 text-xs text-gray-900">
                                                    {formatSubmissionTime(
                                                        submission,
                                                    )}
                                                </td>
                                            )}
                                            {tugas.komponen_rubriks &&
                                            tugas.komponen_rubriks.length >
                                                0 ? (
                                                <>
                                                    {visibleColumns.komponen &&
                                                        tugas.komponen_rubriks.map(
                                                            (komponen) => (
                                                                <td
                                                                    key={
                                                                        komponen.id
                                                                    }
                                                                    className="px-1 py-2"
                                                                >
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            inlineNilaiData[
                                                                                submission
                                                                                    .praktikan_id
                                                                            ]?.[
                                                                                komponen
                                                                                    .id
                                                                            ]
                                                                                ?.nilai ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const value =
                                                                                e
                                                                                    .target
                                                                                    .value;
                                                                            const maxValue =
                                                                                parseFloat(
                                                                                    komponen.nilai_maksimal,
                                                                                );

                                                                            
                                                                            if (
                                                                                parseFloat(
                                                                                    value,
                                                                                ) >
                                                                                maxValue +
                                                                                    0.01
                                                                            ) {
                                                                                toast.warning(
                                                                                    `Nilai tidak boleh melebihi ${maxValue}`,
                                                                                );
                                                                                return;
                                                                            }

                                                                            handleInlineNilaiChange(
                                                                                submission.praktikan_id,
                                                                                komponen.id,
                                                                                "nilai",
                                                                                value,
                                                                            );
                                                                        }}
                                                                        className={`w-12 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                            isEditMode ||
                                                                            editingRow ===
                                                                                submission.praktikan_id
                                                                                ? "border-gray-300 focus:border-blue-500"
                                                                                : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                                                        }`}
                                                                        min="0"
                                                                        max={
                                                                            komponen.nilai_maksimal
                                                                        }
                                                                        step="0.1"
                                                                        placeholder="0"
                                                                        disabled={
                                                                            !(
                                                                                isEditMode ||
                                                                                editingRow ===
                                                                                    submission.praktikan_id
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ),
                                                        )}
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(
                                                                submission.praktikan_id,
                                                            )}
                                                            %
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <textarea
                                                            value={
                                                                submission.feedback ||
                                                                ""
                                                            }
                                                            onChange={(e) => {
                                                                
                                                                const updatedSubmissions =
                                                                    submissions.map(
                                                                        (s) =>
                                                                            s.id ===
                                                                            submission.id
                                                                                ? {
                                                                                      ...s,
                                                                                      feedback:
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                  }
                                                                                : s,
                                                                    );
                                                                
                                                            }}
                                                            placeholder="Feedback..."
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            rows="2"
                                                            disabled={
                                                                !(
                                                                    isEditMode ||
                                                                    editingRow ===
                                                                        submission.praktikan_id
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-2 py-2 text-center">
                                                    <span className="text-xs text-gray-900">
                                                        {submission.nilai
                                                            ? parseFloat(
                                                                  submission.nilai,
                                                              ).toFixed(1)
                                                            : "-"}
                                                    </span>
                                                </td>
                                            )}
                                            {canGrade && (
                                                <td className="px-2 py-2">
                                                    {isEditMode ||
                                                    editingRow ===
                                                        submission.praktikan_id ? (
                                                        <button
                                                            onClick={() =>
                                                                handleSaveIndividualNilai(
                                                                    submission.praktikan_id,
                                                                )
                                                            }
                                                            disabled={
                                                                savingPraktikan ===
                                                                submission.praktikan_id
                                                            }
                                                            className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {savingPraktikan ===
                                                            submission.praktikan_id ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                            ) : (
                                                                <Save className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                toggleRowEdit(
                                                                    submission.praktikan_id,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}

                                
                                {(activeTab === "not-submitted" ||
                                    activeTab === "all") &&
                                    pagedNonSubmitted?.length > 0 &&
                                    pagedNonSubmitted.map((student) => (
                                        <tr
                                            key={student.praktikan_id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-2">
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">
                                                        {student.praktikan
                                                            ?.nama ||
                                                            student.praktikan
                                                                ?.user?.name ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {student.praktikan
                                                            ?.nim || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                                    <XCircle className="w-3 h-3" />
                                                    <span className="ml-1">
                                                        Belum Kumpul
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-2 py-2">
                                                <span className="text-xs text-gray-500">
                                                    -
                                                </span>
                                            </td>
                                            {visibleColumns.waktu && (
                                                <td className="px-2 py-2 text-xs text-gray-500">
                                                    -
                                                </td>
                                            )}
                                            <td className="px-2 py-2 max-w-24 relative">
                                                <div
                                                    className="text-xs text-gray-500 truncate cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                                    onMouseEnter={() =>
                                                        handleCatatanHover(
                                                            student.praktikan_id,
                                                            "",
                                                        )
                                                    }
                                                    onMouseLeave={
                                                        handleCatatanLeave
                                                    }
                                                >
                                                    -
                                                </div>
                                                {hoveredCatatan &&
                                                    hoveredCatatan.praktikanId ===
                                                        student.praktikan_id && (
                                                        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 whitespace-pre-wrap break-words">
                                                            <div className="font-medium mb-1">
                                                                Catatan:
                                                            </div>
                                                            <div className="text-gray-300">
                                                                Tidak ada
                                                                catatan
                                                            </div>
                                                            <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                                        </div>
                                                    )}
                                            </td>
                                            {tugas.komponen_rubriks &&
                                            tugas.komponen_rubriks.length >
                                                0 ? (
                                                <>
                                                    {visibleColumns.komponen &&
                                                        tugas.komponen_rubriks.map(
                                                            (komponen) => (
                                                                <td
                                                                    key={
                                                                        komponen.id
                                                                    }
                                                                    className="px-1 py-2"
                                                                >
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            inlineNilaiData[
                                                                                student
                                                                                    .praktikan_id
                                                                            ]?.[
                                                                                komponen
                                                                                    .id
                                                                            ]
                                                                                ?.nilai ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const value =
                                                                                e
                                                                                    .target
                                                                                    .value;
                                                                            const maxValue =
                                                                                parseFloat(
                                                                                    komponen.nilai_maksimal,
                                                                                );

                                                                            
                                                                            if (
                                                                                parseFloat(
                                                                                    value,
                                                                                ) >
                                                                                maxValue +
                                                                                    0.01
                                                                            ) {
                                                                                toast.warning(
                                                                                    `Nilai tidak boleh melebihi ${maxValue}`,
                                                                                );
                                                                                return;
                                                                            }

                                                                            handleInlineNilaiChange(
                                                                                student.praktikan_id,
                                                                                komponen.id,
                                                                                "nilai",
                                                                                value,
                                                                            );
                                                                        }}
                                                                        className={`w-12 border rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                            isEditMode ||
                                                                            editingRow ===
                                                                                student.praktikan_id
                                                                                ? "border-gray-300 focus:border-blue-500"
                                                                                : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                                                        }`}
                                                                        min="0"
                                                                        max={
                                                                            komponen.nilai_maksimal
                                                                        }
                                                                        step="0.1"
                                                                        placeholder="0"
                                                                        disabled={
                                                                            !(
                                                                                isEditMode ||
                                                                                editingRow ===
                                                                                    student.praktikan_id
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                            ),
                                                        )}
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-sm font-bold text-blue-600">
                                                            {calculateTotalForPraktikan(
                                                                student.praktikan_id,
                                                            )}
                                                            %
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <textarea
                                                            value={
                                                                student.feedback ||
                                                                ""
                                                            }
                                                            onChange={(e) => {
                                                                
                                                                const updatedNonSubmitted =
                                                                    nonSubmittedPraktikans.map(
                                                                        (s) =>
                                                                            s.praktikan_id ===
                                                                            student.praktikan_id
                                                                                ? {
                                                                                      ...s,
                                                                                      feedback:
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                  }
                                                                                : s,
                                                                    );
                                                                
                                                            }}
                                                            placeholder="Feedback..."
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            rows="2"
                                                            disabled={
                                                                !(
                                                                    isEditMode ||
                                                                    editingRow ===
                                                                        student.praktikan_id
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                </>
                                            ) : (
                                                <td className="px-2 py-2 text-center">
                                                    <span className="text-xs text-gray-500">
                                                        -
                                                    </span>
                                                </td>
                                            )}
                                            {canGrade && (
                                                <td className="px-2 py-2">
                                                    {isEditMode ||
                                                    editingRow ===
                                                        student.praktikan_id ? (
                                                        <button
                                                            onClick={() =>
                                                                handleSaveIndividualNilai(
                                                                    student.praktikan_id,
                                                                )
                                                            }
                                                            disabled={
                                                                savingPraktikan ===
                                                                student.praktikan_id
                                                            }
                                                            className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {savingPraktikan ===
                                                            student.praktikan_id ? (
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                            ) : (
                                                                <Save className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                toggleRowEdit(
                                                                    student.praktikan_id,
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center px-1 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}

                                
                                {((activeTab === "submitted" &&
                                    filteredSubmissions?.length === 0) ||
                                    (activeTab === "not-submitted" &&
                                        filteredNonSubmitted?.length === 0) ||
                                    (activeTab === "all" &&
                                        filteredSubmissions?.length === 0 &&
                                        filteredNonSubmitted?.length ===
                                            0)) && (
                                    <tr>
                                        <td
                                            colSpan={
                                                tugas.komponen_rubriks &&
                                                tugas.komponen_rubriks.length >
                                                    0
                                                    ? tugas.komponen_rubriks
                                                          .length + 6
                                                    : 6
                                            }
                                            className="px-6 py-12 text-center"
                                        >
                                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                                {activeTab === "submitted"
                                                    ? "Belum ada pengumpulan"
                                                    : activeTab ===
                                                        "not-submitted"
                                                      ? "Semua praktikan sudah mengumpulkan"
                                                      : "Tidak ada data"}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {activeTab === "submitted"
                                                    ? "Praktikan belum mengumpulkan tugas ini."
                                                    : activeTab ===
                                                        "not-submitted"
                                                      ? "Tidak ada praktikan yang belum mengumpulkan tugas."
                                                      : "Tidak ada data untuk ditampilkan."}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            
            {totalItems > 0 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow mt-4">
                    <div className="text-sm text-gray-500">
                        —&nbsp;{(safePage - 1) * perPage + 1}–
                        {Math.min(safePage * perPage, totalItems)}
                        &nbsp;dari&nbsp;{totalItems}
                    </div>

                    
                    <nav
                        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                    >
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={safePage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                        >
                            «
                        </button>
                        <button
                            onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={safePage === 1}
                            className="relative inline-flex items-center px-2 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                        >
                            ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(
                                (p) =>
                                    p === 1 ||
                                    p === totalPages ||
                                    Math.abs(p - safePage) <= 1,
                            )
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) {
                                    acc.push("...");
                                }
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, idx) =>
                                p === "..." ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={
                                            p === safePage
                                                ? "relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                : "relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        }
                                    >
                                        {p}
                                    </button>
                                ),
                            )}
                        <button
                            onClick={() =>
                                setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1),
                                )
                            }
                            disabled={safePage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                        >
                            ›
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={safePage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus:z-20 focus:outline-offset-0"
                        >
                            »
                        </button>
                    </nav>
                </div>
            )}

            
            {isEditMode &&
                canGrade &&
                tugas.komponen_rubriks &&
                tugas.komponen_rubriks.length > 0 && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleSaveAllNilai}
                            disabled={isSaving}
                            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-lg font-medium"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    <span>Menyimpan Semua Nilai...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Simpan Semua Nilai</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

            
            <RubrikGradingModal
                isOpen={isRubrikGradingOpen}
                onClose={closeRubrikGrading}
                submission={selectedSubmission}
                tugas={tugas}
                onSave={handleRubrikGradeSaved}
            />

            <NilaiTambahanModal
                isOpen={isNilaiTambahanOpen}
                onClose={() => setIsNilaiTambahanOpen(false)}
                tugas={tugas}
                praktikans={tugas.praktikum?.praktikans}
                onSave={handleNilaiTambahanSaved}
            />

            <ManageNilaiTambahanModal
                isOpen={isManageNilaiTambahanOpen}
                onClose={() => setIsManageNilaiTambahanOpen(false)}
                submission={selectedSubmission}
                tugas={tugas}
                onSave={handleNilaiTambahanSaved}
            />

            
            <Modal
                show={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    setImportFile(null);
                }}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            Import Nilai
                        </h3>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                            Upload file Excel yang sudah diisi dengan nilai.
                            Pastikan file sesuai dengan template yang telah
                            didownload.
                        </p>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="import-file"
                            />
                            <label
                                htmlFor="import-file"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                    {importFile
                                        ? importFile.name
                                        : "Klik untuk memilih file Excel"}
                                </span>
                            </label>
                        </div>

                        {importFile && (
                            <div className="mt-2 text-sm text-green-600">
                                ✓ File dipilih: {importFile.name}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setIsImportModalOpen(false);
                                setImportFile(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleImportNilai}
                            disabled={!importFile || isImporting}
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isImporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Mengimport...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    <span>Import</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            
            <ModernPdfViewer
                show={isPdfViewerOpen}
                onClose={() => {
                    setIsPdfViewerOpen(false);
                    setSelectedPdfSubmission(null);
                }}
                fileUrl={selectedPdfSubmission?.url}
                filename={selectedPdfSubmission?.filename}
                allowDownload={true}
            />
        </DashboardLayout>
    );
}