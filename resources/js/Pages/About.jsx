import { ChevronLeft, ChevronRight, Code, Mail, MessageCircle, Phone, Users } from 'lucide-react';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Button from '../Components/Button';
import PageHeader from '../Components/PageHeader';
import PageSection from '../Components/PageSection';
import StatusBadge from '../Components/StatusBadge';
import DashboardLayout from '../Layouts/DashboardLayout';

const PersonAvatar = ({ person }) => {
    const [failed, setFailed] = useState(false);

    if (!person.photo || failed) {
        return (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-box bg-base-300">
                <Users className="h-7 w-7 text-base-content/50" aria-hidden="true" />
            </span>
        );
    }

    return (
        <img
            src={person.photo}
            alt=""
            className="h-16 w-16 shrink-0 rounded-box object-cover ring-1 ring-base-content/10"
            onError={() => setFailed(true)}
        />
    );
};

const About = ({ appInfo, developers, serverProviders }) => {
    const mainDeveloper = developers.find((developer) => developer.type === 'utama') || developers[0];
    const supportingDevelopers = developers.filter((developer) => developer !== mainDeveloper);
    const collaboratorSlides = useMemo(() => [
        ...supportingDevelopers.map((item) => ({ ...item, category: 'Tim Pendukung' })),
        ...(serverProviders || []).map((item) => ({ ...item, category: 'Penyedia Server' })),
    ], [supportingDevelopers, serverProviders]);
    const cardsPerView = 3;
    const totalPages = Math.max(1, Math.ceil(collaboratorSlides.length / cardsPerView));
    const [slideIndex, setSlideIndex] = useState(0);
    const visibleSlides = collaboratorSlides.slice(slideIndex * cardsPerView, slideIndex * cardsPerView + cardsPerView);
    const moveSlide = (direction) => setSlideIndex((current) => collaboratorSlides.length === 0 ? 0 : (current + direction + totalPages) % totalPages);

    return (
        <DashboardLayout>
            <Head title="Tentang Aplikasi" />
            <div className="space-y-6">
                <PageHeader title="Tentang Aplikasi" description="Profil sistem, versi rilis, dan tim pengembang." />

                <PageSection title={appInfo.full_name}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-base-content/60">Versi</p>
                            <p className="font-semibold text-base-content">{appInfo.version} (Major Release 2.0)</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/60">Status</p>
                            <StatusBadge status="active" label="Aktif" />
                        </div>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-base-content/70">{appInfo.description}</p>
                    <div className="mt-5 rounded-box bg-base-200 p-4">
                        <p className="text-sm leading-relaxed text-base-content/80">{appInfo.development_story}</p>
                    </div>
                    <h3 className="mt-6 font-semibold text-base-content">Fitur Utama</h3>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                        {appInfo.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm text-base-content/80">
                                <Code className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </PageSection>

                <PageSection title="Tim Pengembang">
                    {mainDeveloper && (
                        <article className="rounded-box bg-base-200 p-5 sm:p-6">
                            <StatusBadge status="info" label="Pengembang Utama" />
                            <div className="mt-4 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                                <img src={mainDeveloper.photo} alt="" className="h-24 w-24 shrink-0 rounded-full object-cover ring-1 ring-base-content/10" />
                                <div className="min-w-0">
                                    <h3 className="text-xl font-bold text-base-content">{mainDeveloper.name}</h3>
                                    <p className="mt-1 text-sm font-semibold text-primary">{mainDeveloper.role}</p>
                                    <p className="mt-3 text-sm italic text-base-content/80">“{mainDeveloper.quote}”</p>
                                    <a href={`mailto:${mainDeveloper.email}`} className="mt-3 inline-flex min-h-11 items-center text-sm text-base-content/70 hover:text-primary">{mainDeveloper.email}</a>
                                </div>
                            </div>
                        </article>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold text-base-content">Tim Pendukung dan Penyedia Server</h3>
                        {collaboratorSlides.length > cardsPerView && (
                            <div className="flex gap-2" aria-label={`Halaman ${slideIndex + 1} dari ${totalPages}`}>
                                <Button variant="ghost" size="sm" onClick={() => moveSlide(-1)} aria-label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => moveSlide(1)} aria-label="Halaman berikutnya"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>

                    {collaboratorSlides.length > 0 ? (
                        <div className="mt-3 grid gap-4 md:grid-cols-3">
                            {visibleSlides.map((person, index) => (
                                <article key={`${person.email}-${index}`} className="rounded-box bg-base-200 p-4">
                                    <StatusBadge status="neutral" label={person.category} />
                                    <div className="mt-4 flex items-start gap-3">
                                        <PersonAvatar person={person} />
                                        <div className="min-w-0"><h4 className="font-semibold text-base-content">{person.name}</h4><p className="mt-1 text-xs font-medium text-primary">{person.role}</p></div>
                                    </div>
                                    <div className="mt-4 flex items-start gap-2 text-xs italic text-base-content/70"><MessageCircle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><p className="line-clamp-3">“{person.quote}”</p></div>
                                    <a href={`mailto:${person.email}`} className="mt-3 flex min-h-11 items-center gap-2 text-xs text-base-content/60 hover:text-primary"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{person.email}</span></a>
                                </article>
                            ))}
                        </div>
                    ) : <p className="mt-3 text-sm text-base-content/60">Belum ada data tim pendukung atau penyedia server.</p>}
                </PageSection>

                <PageSection title="Kontak dan Dukungan">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <a href="mailto:nouvalhabibie18@gmail.com" className="flex min-h-11 items-center gap-3 rounded-box bg-base-200 p-3 hover:text-primary"><Mail className="h-5 w-5" aria-hidden="true" /><span><span className="block text-sm font-medium">Email</span><span className="block text-sm text-base-content/70">nouvalhabibie18@gmail.com</span></span></a>
                        <a href="tel:+6285142247464" className="flex min-h-11 items-center gap-3 rounded-box bg-base-200 p-3 hover:text-primary"><Phone className="h-5 w-5" aria-hidden="true" /><span><span className="block text-sm font-medium">Telepon</span><span className="block text-sm text-base-content/70">+628 51422 47464</span></span></a>
                    </div>
                </PageSection>
            </div>
        </DashboardLayout>
    );
};

export default About;
