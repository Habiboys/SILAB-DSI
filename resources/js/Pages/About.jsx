import {
    ChatBubbleLeftRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CodeBracketIcon,
    EnvelopeIcon,
    InformationCircleIcon,
    PhoneIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Head } from "@inertiajs/react";
import { useMemo, useState } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";

const About = ({ appInfo, developers, serverProviders }) => {
    const mainDeveloper =
        developers.find((d) => d.type === "utama") || developers[0];
    const supportingDevelopers = developers.filter((d) => d !== mainDeveloper);

    const collaboratorSlides = useMemo(() => {
        const support = supportingDevelopers.map((item) => ({
            ...item,
            category: "Tim Pendukung",
        }));
        const providers = (serverProviders || []).map((item) => ({
            ...item,
            category: "Penyedia Server",
        }));
        return [...support, ...providers];
    }, [supportingDevelopers, serverProviders]);

    const cardsPerView = 3;
    const totalPages = Math.max(
        1,
        Math.ceil(collaboratorSlides.length / cardsPerView),
    );
    const [slideIndex, setSlideIndex] = useState(0);
    const visibleSlides = collaboratorSlides.slice(
        slideIndex * cardsPerView,
        slideIndex * cardsPerView + cardsPerView,
    );

    const handlePrevSlide = () => {
        setSlideIndex((prev) =>
            collaboratorSlides.length === 0
                ? 0
                : (prev - 1 + totalPages) % totalPages,
        );
    };

    const handleNextSlide = () => {
        setSlideIndex((prev) =>
            collaboratorSlides.length === 0 ? 0 : (prev + 1) % totalPages,
        );
    };

    return (
        <DashboardLayout>
            <Head title="Tentang Aplikasi" />

            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                        <InformationCircleIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tentang Aplikasi
                        </h1>
                        <p className="text-gray-600">
                            Profil sistem, versi rilis, dan tim pengembang
                        </p>
                    </div>
                </div>
            </div>

            {/* App Info & Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {appInfo.full_name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-600">Versi</p>
                        <p className="font-semibold text-blue-700">
                            {appInfo.version} (Major Release 2.0)
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aktif
                        </span>
                    </div>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                    {appInfo.description}
                </p>

                <div className="mb-6 p-4 rounded-lg border border-blue-100 bg-blue-50">
                    <p className="text-sm text-blue-900 leading-relaxed">
                        {appInfo.development_story}
                    </p>
                </div>

                {/* Features */}
                <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-3">
                        Fitur Utama
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {appInfo.features.map((feature, index) => (
                            <div key={index} className="flex items-center">
                                <CodeBracketIcon className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm text-gray-700">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Developers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Tim Pengembang
                </h2>

                {/* Main Developer */}
                {mainDeveloper && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                        <p className="text-xs font-semibold tracking-wide text-blue-700 mb-2 uppercase">
                            Pengembang Utama
                        </p>
                        <div className="flex flex-col gap-5 items-center text-center">
                            <img
                                src={mainDeveloper.photo}
                                alt={mainDeveloper.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                            />
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {mainDeveloper.name}
                                </h3>
                                <p className="text-sm text-blue-700 font-semibold mt-1">
                                    {mainDeveloper.role}
                                </p>
                                <p className="text-sm text-gray-700 italic mt-3">
                                    "{mainDeveloper.quote}"
                                </p>
                                <p className="text-sm text-gray-500 mt-3">
                                    {mainDeveloper.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Supporting Team */}
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Tim Pendukung & Penyedia Server
                </h3>
                {collaboratorSlides.length > 0 ? (
                    <div className="rounded-xl border border-gray-200 p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                                Slide {slideIndex + 1} dari {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevSlide}
                                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                    aria-label="Sebelumnya"
                                >
                                    <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={handleNextSlide}
                                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                                    aria-label="Berikutnya"
                                >
                                    <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {visibleSlides.map((person, idx) => (
                                <div
                                    key={`${person.email}-${idx}`}
                                    className="rounded-lg border border-gray-200 p-4 bg-gray-50"
                                >
                                    <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mb-3">
                                        {person.category}
                                    </span>

                                    <div className="flex items-start gap-3">
                                        <img
                                            src={person.photo}
                                            alt={person.name}
                                            className="w-16 h-16 rounded-lg object-cover border-2 border-blue-200 flex-shrink-0"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display =
                                                    "flex";
                                            }}
                                        />
                                        <div
                                            className="w-16 h-16 rounded-lg bg-blue-100 items-center justify-center border-2 border-blue-200 flex-shrink-0"
                                            style={{ display: "none" }}
                                        >
                                            <UserGroupIcon className="h-8 w-8 text-blue-600" />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                                {person.name}
                                            </h3>
                                            <p className="text-xs text-blue-600 mt-1 font-medium">
                                                {person.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                        <div className="flex items-start">
                                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-700 italic line-clamp-3">
                                                "{person.quote}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 mt-3">
                                        <EnvelopeIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                        <span className="truncate">
                                            {person.email}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center mt-4 gap-2">
                            {Array.from({ length: totalPages }).map(
                                (_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSlideIndex(idx)}
                                        className={`h-2.5 rounded-full transition-all ${
                                            idx === slideIndex
                                                ? "w-6 bg-blue-600"
                                                : "w-2.5 bg-gray-300"
                                        }`}
                                        aria-label={`Slide ${idx + 1}`}
                                    />
                                ),
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">
                        Belum ada data tim pendukung atau penyedia server.
                    </p>
                )}
            </div>

            {/* Contact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Kontak & Dukungan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Email
                            </p>
                            <p className="text-sm text-gray-600">
                                nouvalhabibie18@gmail.com
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Telepon
                            </p>
                            <p className="text-sm text-gray-600">
                                +628 51422 47464
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default About;
