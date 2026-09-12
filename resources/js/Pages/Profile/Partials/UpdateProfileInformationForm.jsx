import Button from "@/Components/Button";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Link, useForm, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    isPraktikan = false,
    praktikan = null,
    className = "",
}) {
    const user = usePage().props.auth.user;
    const profile = usePage().props.profile;
    const [previewImage, setPreviewImage] = useState(null);
    const [previewTtd, setPreviewTtd] = useState(null);

    const {
        data,
        setData,
        post,
        transform,
        errors,
        processing,
        recentlySuccessful,
    } = useForm(
        isPraktikan
            ? { no_hp: praktikan?.no_hp || "" }
            : {
                name: user.name,
                email: user.email,
                nomor_induk: profile?.nomor_induk || "",
                nomor_anggota: profile?.nomor_anggota || "",
                jenis_kelamin: profile?.jenis_kelamin || "",
                alamat: profile?.alamat || "",
                no_hp: profile?.no_hp || "",
                tempat_lahir: profile?.tempat_lahir || "",
                tanggal_lahir: profile?.tanggal_lahir || "",
                foto_profile: null,
                tanda_tangan: null,
            }
    );

    
    const displayData = {
        nomor_induk: profile?.nomor_induk || "",
        nomor_anggota: profile?.nomor_anggota || "",
    };

    
    useEffect(() => {
        if (!isPraktikan && profile) {
            const formatDate = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().split("T")[0];
            };

            setData({
                name: user.name,
                email: user.email,
                nomor_induk: profile.nomor_induk || "",
                nomor_anggota: profile.nomor_anggota || "",
                jenis_kelamin: profile.jenis_kelamin || "",
                alamat: profile.alamat || "",
                no_hp: profile.no_hp || "",
                tempat_lahir: profile.tempat_lahir || "",
                tanggal_lahir: formatDate(profile.tanggal_lahir),
                foto_profile: null,
            });
        }
    }, [profile, user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("foto_profile", file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleTtdChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("tanda_tangan", file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewTtd(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const submit = (e) => {
        e.preventDefault();

        if (isPraktikan) {
            transform((current) => ({ ...current, _method: "patch" }));
            post(route("profile.update"), { forceFormData: true });
            return;
        }

        if (!data.email || data.email.trim() === "") return;
        if (!data.name || data.name.trim() === "") return;

        
        transform((current) => ({ ...current, _method: "patch" }));

        post(route("profile.update"), { forceFormData: true });
    };

    if (isPraktikan) {
        return (
            <section className={className}>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="nim" value="NIM" />
                            <TextInput
                                id="nim"
                                className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                                value={praktikan?.nim || ""}
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="nama" value="Nama" />
                            <TextInput
                                id="nama"
                                className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                                value={praktikan?.nama || user.name}
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                                value={user.email}
                                readOnly
                                disabled
                            />
                            <p className="mt-1 text-xs text-base-content/60">Email tidak dapat diubah.</p>
                        </div>
                        <div>
                            <InputLabel htmlFor="no_hp" value="No. HP *" />
                            <TextInput
                                id="no_hp"
                                className="mt-1 block w-full"
                                value={data.no_hp}
                                onChange={(e) => setData("no_hp", e.target.value)}
                                autoComplete="tel"
                                placeholder="08xxxxxxxxxx"
                            />
                            <InputError className="mt-2" message={errors.no_hp} />
                            <p className="mt-1 text-xs text-base-content/60">Wajib diisi untuk menerima notifikasi.</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-base-content/10 pt-5">
                        <Button type="submit" loading={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
                        {recentlySuccessful && <p className="text-sm font-medium text-success">Tersimpan.</p>}
                    </div>
                </form>
            </section>
        );
    }

    return (
        <section className={className}>
            <form
                onSubmit={submit}
                className="space-y-6"
                encType="multipart/form-data"
            >
                
                <div className="flex items-center space-x-6">
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <img
                                className="h-20 w-20 rounded-full object-cover"
                                src={
                                    previewImage ||
                                    profile?.foto_profile ||
                                    "/images/default-avatar.png"
                                }
                                alt="Profile photo"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <InputLabel
                            htmlFor="foto_profile"
                            value="Foto Profil"
                        />
                        <input
                            id="foto_profile"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="file-input file-input-bordered mt-1 block w-full"
                        />
                        <InputError
                            className="mt-2"
                            message={errors.foto_profile}
                        />
                        <p className="mt-1 text-xs text-base-content/60">
                            Format: JPG, PNG, GIF. Maksimal 2MB.
                        </p>
                    </div>
                </div>

                
                <div className="flex items-start space-x-6 border-t border-base-content/10 pt-6">
                    <div className="flex-shrink-0">
                        <div className="relative flex items-center justify-center rounded-box border border-base-content/10 bg-base-200" style={{ width: 120, height: 60 }}>
                            {(previewTtd || profile?.tanda_tangan) ? (
                                <img
                                    className="object-contain w-full h-full rounded"
                                    src={previewTtd || profile.tanda_tangan}
                                    alt="Tanda tangan"
                                />
                            ) : (
                                <span className="text-xs text-base-content/50">Belum ada</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <InputLabel htmlFor="tanda_tangan" value="Tanda Tangan" />
                        <input
                            id="tanda_tangan"
                            type="file"
                            accept="image/*"
                            onChange={handleTtdChange}
                            className="file-input file-input-bordered mt-1 block w-full"
                        />
                        <InputError className="mt-2" message={errors.tanda_tangan} />
                        <p className="mt-1 text-xs text-base-content/60">
                            Upload gambar tanda tangan (PNG transparan dianjurkan). Digunakan untuk dokumen LPJ dan sertifikat.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="name" value="Nama" />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                            value={data.name}
                            readOnly
                            disabled
                            autoComplete="name"
                        />
                        <p className="mt-1 text-sm text-base-content/60">
                            Nama tidak dapat diubah
                        </p>
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                            value={data.email}
                            readOnly
                            disabled
                            autoComplete="username"
                        />
                        <InputError className="mt-2" message={errors.email} />
                        <p className="mt-1 text-sm text-base-content/60">
                            Email tidak dapat diubah
                        </p>
                    </div>
                </div>

                
                <div className="border-t border-base-content/10 pt-6">
                    <h3 className="mb-4 text-lg font-medium text-base-content">
                        Informasi Profil
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="nomor_induk"
                                value="Nomor Induk"
                            />
                            {displayData.nomor_induk ? (
                                <>
                                    <TextInput
                                        id="nomor_induk"
                                        className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                                        value={displayData.nomor_induk}
                                        readOnly
                                        disabled
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-sm text-base-content/60">
                                        Nomor induk tidak dapat diubah
                                    </p>
                                </>
                            ) : (
                                <>
                                    <TextInput
                                        id="nomor_induk"
                                        className="mt-1 block w-full"
                                        value={data.nomor_induk || ""}
                                        onChange={(e) =>
                                            setData("nomor_induk", e.target.value)
                                        }
                                        autoComplete="off"
                                        placeholder="Masukkan nomor induk"
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.nomor_induk}
                                    />
                                </>
                            )}
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="nomor_anggota"
                                value="Nomor Anggota"
                            />
                            {displayData.nomor_anggota ? (
                                <>
                                    <TextInput
                                        id="nomor_anggota"
                                        className="mt-1 block w-full bg-base-200 cursor-not-allowed"
                                        value={displayData.nomor_anggota}
                                        readOnly
                                        disabled
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-sm text-base-content/60">
                                        Nomor anggota tidak dapat diubah
                                    </p>
                                </>
                            ) : (
                                <>
                                    <TextInput
                                        id="nomor_anggota"
                                        className="mt-1 block w-full"
                                        value={data.nomor_anggota || ""}
                                        onChange={(e) =>
                                            setData("nomor_anggota", e.target.value)
                                        }
                                        autoComplete="off"
                                        placeholder="Masukkan nomor anggota"
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.nomor_anggota}
                                    />
                                </>
                            )}
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="jenis_kelamin"
                                value="Jenis Kelamin"
                            />
                            <select
                                id="jenis_kelamin"
                                className="select select-bordered mt-1 block w-full min-h-11"
                                value={data.jenis_kelamin}
                                onChange={(e) =>
                                    setData("jenis_kelamin", e.target.value)
                                }
                            >
                                <option value="">Pilih Jenis Kelamin</option>
                                <option value="laki-laki">Laki-laki</option>
                                <option value="perempuan">Perempuan</option>
                            </select>
                            <InputError
                                className="mt-2"
                                message={errors.jenis_kelamin}
                            />
                            
                        </div>

                        <div>
                            <InputLabel htmlFor="no_hp" value="No. HP" />
                            <TextInput
                                id="no_hp"
                                className="mt-1 block w-full"
                                value={data.no_hp}
                                onChange={(e) =>
                                    setData("no_hp", e.target.value)
                                }
                                autoComplete="tel"
                            />
                            <InputError
                                className="mt-2"
                                message={errors.no_hp}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="tempat_lahir"
                                value="Tempat Lahir"
                            />
                            <TextInput
                                id="tempat_lahir"
                                className="mt-1 block w-full"
                                value={data.tempat_lahir}
                                onChange={(e) =>
                                    setData("tempat_lahir", e.target.value)
                                }
                                autoComplete="off"
                            />
                            <InputError
                                className="mt-2"
                                message={errors.tempat_lahir}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="tanggal_lahir"
                                value="Tanggal Lahir"
                            />
                            <TextInput
                                id="tanggal_lahir"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.tanggal_lahir}
                                onChange={(e) =>
                                    setData("tanggal_lahir", e.target.value)
                                }
                            />
                            <InputError
                                className="mt-2"
                                message={errors.tanggal_lahir}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <InputLabel htmlFor="alamat" value="Alamat" />
                        <textarea
                            id="alamat"
                            rows={3}
                            className="textarea textarea-bordered mt-1 block w-full"
                            value={data.alamat}
                            onChange={(e) => setData("alamat", e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.alamat} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="alert alert-warning items-start">
                        <div>
                            <p className="text-sm">
                                Alamat email Anda belum diverifikasi.{" "}
                                <Link
                                    href={route("verification.send")}
                                    method="post"
                                    as="button"
                                    className="link font-medium"
                                >
                                    Klik di sini untuk mengirim ulang email
                                    verifikasi.
                                </Link>
                            </p>

                            {status === "verification-link-sent" && (
                                <p className="mt-2 text-sm font-medium text-success">
                                    Link verifikasi baru telah dikirim ke
                                    alamat email Anda.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-base-content/10 pt-5">
                    <Button type="submit" loading={processing}>{processing ? "Menyimpan..." : "Simpan"}</Button>
                    {recentlySuccessful && (
                        <p className="text-sm font-medium text-success">
                            Tersimpan.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
