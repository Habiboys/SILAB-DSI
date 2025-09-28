import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "../Layouts/DashboardLayout";
import {
    InformationCircleIcon,
    CodeBracketIcon,
    UserGroupIcon,
    EnvelopeIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const About = ({ appInfo, developers, serverProviders }) => {
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
                            Informasi sistem dan tim pengembang
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
                        <p className="font-medium">{appInfo.version}</p>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {developers.map((developer, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="mb-4">
                                <img
                                    src={developer.photo}
                                    alt={developer.name}
                                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-200"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                            "block";
                                    }}
                                />
                                <div
                                    className="w-24 h-24 rounded-full mx-auto bg-blue-100 flex items-center justify-center border-4 border-blue-200"
                                    style={{ display: "none" }}
                                >
                                    <UserGroupIcon className="h-12 w-12 text-blue-600" />
                                </div>
                            </div>

                            <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                                {developer.name}
                            </h3>
                            <p className="text-sm text-blue-600 mb-3 font-medium">
                                {developer.role}
                            </p>

                            {/* Quote */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <div className="flex items-start">
                                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-700 italic">
                                        "{developer.quote}"
                                    </p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                <span className="truncate">
                                    {developer.email}
                                </span>
                            </div>

                            {/* Social Media */}
                            <div className="flex justify-center space-x-3">
                                <a
                                    href={developer.social_media.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-pink-600 hover:text-pink-700 transition-colors"
                                    title="Instagram"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a
                                    href={developer.social_media.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    title="LinkedIn"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                                <a
                                    href={developer.social_media.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-700 transition-colors"
                                    title="GitHub"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Server Providers */}
            {serverProviders && serverProviders.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Penyedia Server
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {serverProviders.map((serverProvider, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="mb-4">
                                    <img
                                        src={serverProvider.photo}
                                        alt={serverProvider.name}
                                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-200"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display =
                                                "block";
                                        }}
                                    />
                                    <div
                                        className="w-24 h-24 rounded-full mx-auto bg-green-100 flex items-center justify-center border-4 border-green-200"
                                        style={{ display: "none" }}
                                    >
                                        <UserGroupIcon className="h-12 w-12 text-green-600" />
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                                    {serverProvider.name}
                                </h3>
                                <p className="text-sm text-green-600 mb-3 font-medium">
                                    {serverProvider.role}
                                </p>

                                {/* Quote */}
                                <div className="mb-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                    <div className="flex items-start">
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-700 italic">
                                            "{serverProvider.quote}"
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                                    <span className="truncate">
                                        {serverProvider.email}
                                    </span>
                                </div>

                                {/* Social Media */}
                                <div className="flex justify-center space-x-3">
                                    <a
                                        href={
                                            serverProvider.social_media
                                                .instagram
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-pink-600 hover:text-pink-700 transition-colors"
                                        title="Instagram"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    </a>
                                    <a
                                        href={
                                            serverProvider.social_media.linkedin
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 transition-colors"
                                        title="LinkedIn"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </a>
                                    <a
                                        href={
                                            serverProvider.social_media.github
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-700 transition-colors"
                                        title="GitHub"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
