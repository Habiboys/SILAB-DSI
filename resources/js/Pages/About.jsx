import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '../Layouts/DashboardLayout';
import { 
    InformationCircleIcon,
    CodeBracketIcon, 
    UserGroupIcon,
    EnvelopeIcon,
    PhoneIcon
} from '@heroicons/react/24/outline';

const About = ({ appInfo, developers }) => {
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
                    <h3 className="text-md font-semibold text-gray-900 mb-3">Fitur Utama</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {appInfo.features.map((feature, index) => (
                            <div key={index} className="flex items-center">
                                <CodeBracketIcon className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm text-gray-700">{feature}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {developers.map((developer, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="mb-3">
                                <img 
                                    src={developer.photo} 
                                    alt={developer.name}
                                    className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-blue-200"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                                <div className="w-24 h-24 rounded-full mx-auto bg-blue-100 flex items-center justify-center border-2 border-blue-200" style={{display: 'none'}}>
                                    <UserGroupIcon className="h-12 w-12 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">{developer.name}</h3>
                            <p className="text-sm text-blue-600 mb-2">{developer.role}</p>
                            <p className="text-sm text-gray-600 mb-3">{developer.description}</p>
                            <div className="flex items-center justify-center text-sm text-gray-500">
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                {developer.email}
                            </div>
                        </div>
                    ))}
                </div>
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
                            <p className="text-sm font-medium text-gray-900">Email</p>
                            <p className="text-sm text-gray-600">nouvalhabibie18@gmail.com</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Telepon</p>
                            <p className="text-sm text-gray-600">+628 51422 47464</p>
                        </div>
                    </div>
                </div>
            </div>


        </DashboardLayout>
    );
};

export default About;
