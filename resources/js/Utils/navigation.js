const CONTEXT_KEYS = ['lab_id', 'kepengurusan_lab_id'];
const LABELS = {
    dashboard: 'Dashboard', inventaris: 'Inventaris', permohonan: 'Permohonan', peminjaman: 'Peminjaman',
    praktikum: 'Praktikum', kegiatan: 'Kegiatan', proker: 'Program Kerja', kuesioner: 'Kuesioner',
    sertifikat: 'Sertifikat', piket: 'Piket', admin: 'Administrasi', profile: 'Profil',
    'data-master': 'Data Master', 'kepengurusan-lab': 'Kepengurusan Laboratorium',
    'riwayat-keuangan': 'Riwayat Keuangan', 'catatan-kas': 'Catatan Kas', 'rekap-keuangan': 'Rekap Keuangan',
    praktikan: 'Praktikan', tugas: 'Tugas', modul: 'Modul', pertemuan: 'Pertemuan', riwayat: 'Riwayat',
    create: 'Tambah', edit: 'Edit', show: 'Detail', results: 'Hasil', submissions: 'Pengumpulan Tugas',
    komponen: 'Komponen Rubrik', 'daftar-tugas': 'Kelas Praktikum Saya', 'riwayat-tugas': 'Riwayat Pengumpulan',
    'surat-menyurat': 'Surat Menyurat', 'surat-masuk': 'Surat Masuk', 'surat-keluar': 'Surat Keluar',
};
const NAME_KEYS = ['mata_kuliah', 'nama_praktikum', 'judul_tugas', 'judul', 'nama_kegiatan', 'nama_proker', 'nama_kelas', 'nama', 'name', 'perihal', 'kode_barang'];
const BLOCKED_ROUTE = /(?:^|\.)(?:login|logout|register|password|verification|download|export[^.]*|view-instruksi|view|calendar-data|warnings|check-data|template-download|get|data|public)(?:\.|$)/;
const validId = (value) => value !== undefined && value !== null && !['', 'undefined', 'null'].includes(String(value));
export const labelFor = (value) => LABELS[value] || value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

export function internalUrl(value, origin) {
    try {
        const url = new URL(String(value), origin);
        return url.origin === origin && !url.username && !url.password ? url : null;
    } catch { return null; }
}

export function matchPage(value, routes, origin) {
    const url = internalUrl(value, origin);
    if (!url || /\/(?:undefined|null)(?:\/|$)/.test(url.pathname)) return null;
    const path = url.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    const matches = [];
    for (const [name, definition] of Object.entries(routes)) {
        if (!definition.methods?.includes('GET') || BLOCKED_ROUTE.test(name)) continue;
        const parts = definition.uri.split('/').filter(Boolean);
        const parameters = {};
        let score = 0;
        let position = 0;
        let valid = true;
        for (const part of parts) {
            const parameter = part.match(/^\{([^}?]+)(\?)?\}$/);
            const segment = path[position++];
            if (parameter) {
                if (segment === undefined && parameter[2]) { position--; continue; }
                if (!validId(segment)) { valid = false; break; }
                const reserved = Object.values(routes).some((candidate) => candidate.uri.split('/').filter(Boolean)[position - 1] === segment);
                if (reserved) { valid = false; break; }
                const constraint = definition.wheres?.[parameter[1]];
                if (constraint && !new RegExp(`^(?:${constraint})$`).test(segment)) { valid = false; break; }
                parameters[parameter[1]] = decodeURIComponent(segment);
            } else if (part !== segment) { valid = false; break; }
            else score += 10;
        }
        if (valid && path.length === position) matches.push({ name, definition, parameters, score });
    }
    return matches.sort((a, b) => b.score - a.score)[0] || null;
}

export function pageEntities(props) {
    const roots = ['praktikum', 'praktikumData', 'tugas', 'tugasPraktikum', 'pertemuan', 'kegiatan', 'proker', 'kepengurusanLab', 'kepengurusanlab', 'kuesioner', 'permohonan', 'surat', 'riwayat'];
    const entities = roots.map((key) => props[key]).filter((value) => value && !Array.isArray(value) && !value.data);
    for (let index = 0; index < entities.length && index < 30; index++) {
        const entity = entities[index];
        for (const key of ['praktikum', 'tugas_praktikum', 'tugasPraktikum', 'proker', 'kepengurusan_lab', 'kepengurusanLab']) {
            if (entity[key] && !entities.includes(entity[key])) entities.push(entity[key]);
        }
    }
    return entities;
}

export function navigationContext(page) {
    const query = new URL(page.url, 'http://local').searchParams;
    const entities = pageEntities(page.props || {});
    const period = entities.find((entity) => validId(entity.laboratorium_id) && entity.tahun_kepengurusan_id);
    const entityPeriod = entities.find((entity) => validId(entity.kepengurusan_lab_id));
    const labId = period?.laboratorium_id || entities.find((entity) => validId(entity.laboratorium_id))?.laboratorium_id;
    const periodId = period?.id || entityPeriod?.kepengurusan_lab_id;
    return Object.fromEntries(Object.entries({
        lab_id: page.props?.navigation_context?.lab_id || labId || query.get('lab_id') || page.props?.auth?.user?.laboratory?.id,
        kepengurusan_lab_id: page.props?.navigation_context?.kepengurusan_lab_id || periodId || query.get('kepengurusan_lab_id') || page.props?.kepengurusanLabId || page.props?.selected_kepengurusan?.id,
    }).filter(([, value]) => validId(value)).map(([key, value]) => [key, String(value)]));
}

export function withContext(value, context, origin) {
    const url = internalUrl(value, origin);
    if (!url) return value;
    const switchesLab = url.searchParams.has('lab_id') && url.searchParams.get('lab_id') !== context.lab_id;
    const switchesPeriod = url.searchParams.has('kepengurusan_lab_id') && url.searchParams.get('kepengurusan_lab_id') !== context.kepengurusan_lab_id;
    for (const key of CONTEXT_KEYS) {
        if (switchesLab && key === 'kepengurusan_lab_id') continue;
        if (switchesPeriod && key === 'lab_id') continue;
        if (!url.searchParams.has(key) && validId(context[key])) url.searchParams.set(key, context[key]);
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

function sameContext(a, b) {
    return CONTEXT_KEYS.every((key) => !a[key] || !b[key] || a[key] === b[key]);
}

export function recordPage(history, page, origin) {
    const url = internalUrl(page.url, origin);
    if (!url) return history;
    const entry = { url: `${url.pathname}${url.search}${url.hash}`, context: navigationContext(page) };
    const last = history.at(-1);
    if (last && internalUrl(last.url, origin)?.pathname === url.pathname && sameContext(last.context, entry.context)) {
        return [...history.slice(0, -1), entry];
    }
    const previous = history.findLastIndex((item) => item.url === entry.url && sameContext(item.context, entry.context));
    return previous >= 0 ? [...history.slice(0, previous), entry] : [...history, entry].slice(-60);
}

export function restoreParent(value, page, history, origin) {
    const target = internalUrl(value, origin);
    if (!target) return null;
    const context = navigationContext(page);
    const sourceQuery = new URL(page.url, origin).searchParams;
    const previous = history.findLast((entry) => {
        const candidate = internalUrl(entry.url, origin);
        return candidate?.pathname === target.pathname && sameContext(entry.context, context)
            && ['kelas_id', 'context_kelas_id'].every((key) => !sourceQuery.has(key) || !candidate.searchParams.has(key) || sourceQuery.get(key) === candidate.searchParams.get(key));
    });
    if (previous) return previous.url;
    const fallback = new URL(withContext(value, context, origin), origin);
    if (/^\/(?:praktikum|praktikan)\//.test(fallback.pathname)) {
        const source = new URL(page.url, origin);
        for (const key of ['kelas_id', 'context_kelas_id']) {
            const value = source.searchParams.get(key) || page.props?.filters?.[key];
            if (validId(value) && !fallback.searchParams.has(key)) fallback.searchParams.set(key, value);
        }
    }
    return `${fallback.pathname}${fallback.search}${fallback.hash}`;
}

export function backDestination(page, fallback, history, routes, origin, mode = 'back') {
    const current = internalUrl(page.url, origin);
    const context = navigationContext(page);
    const candidates = history.filter((entry) => internalUrl(entry.url, origin)?.pathname !== current?.pathname && sameContext(entry.context, context));
    const previous = [...candidates].reverse().find((entry) => {
        const target = internalUrl(entry.url, origin);
        return matchPage(entry.url, routes, origin) && !target.pathname.startsWith(`${current.pathname}/`)
            && !/\/(?:create|edit)$/.test(target.pathname);
    });
    if (mode === 'back' && previous) return previous.url;
    const target = matchPage(fallback, routes, origin) ? fallback : '/dashboard';
    return restoreParent(target, page, candidates, origin);
}

export function buildBreadcrumbs(page, routes, makeRoute, history, origin) {
    const current = internalUrl(page.url, origin);
    if (!current || current.pathname === '/dashboard') return [];
    const context = navigationContext(page);
    const entities = pageEntities(page.props || {});
    const items = [];
    const add = (name, parameters, label) => {
        if (!routes[name]?.methods?.includes('GET')) return;
        try {
            const href = makeRoute(name, parameters);
            if (!matchPage(href, routes, origin) || items.some((item) => internalUrl(item.href, origin)?.pathname === internalUrl(href, origin)?.pathname)) return;
            items.push({ label, href: restoreParent(href, page, history, origin) });
        } catch { /* Missing parent data leaves that level unlinked. */ }
    };
    const matched = matchPage(page.url, routes, origin);
    const praktikum = page.props?.praktikum || page.props?.praktikumData || entities.find((entity) => entity.mata_kuliah);
    const tugas = page.props?.tugas || page.props?.tugasPraktikum || entities.find((entity) => entity.judul_tugas);
    const praktikumId = praktikum?.id || tugas?.praktikum_id || page.props?.pertemuan?.praktikum_id;
    if (current.pathname.startsWith('/praktikan/')) {
        add('praktikan.daftar-tugas', {}, 'Kelas Praktikum Saya');
        if (validId(praktikumId)) {
            add('praktikan.praktikum.tugas', { praktikum: praktikumId }, praktikum?.mata_kuliah || 'Tugas Praktikum');
            if (current.pathname.includes('/riwayat-tugas/')) add('praktikan.riwayat.praktikum', { praktikum: praktikumId }, 'Riwayat Pengumpulan');
        }
    } else if (current.pathname.startsWith('/praktikum/') && /\/praktikum\/(?:tugas|pertemuan)\//.test(current.pathname)) {
        add('praktikum.index', {}, 'Praktikum');
        if (validId(praktikumId)) {
            add('praktikum.show', { praktikum: praktikumId }, praktikum?.mata_kuliah || 'Detail Praktikum');
            add(current.pathname.includes('/pertemuan/') ? 'praktikum.pertemuan.index' : 'praktikum.tugas.index', { praktikum: praktikumId }, current.pathname.includes('/pertemuan/') ? 'Pertemuan' : 'Tugas');
        }
        if (validId(tugas?.id) && !current.pathname.includes('/pertemuan/')) add('praktikum.tugas.submissions', { tugas: tugas.id }, tugas.judul_tugas || 'Pengumpulan Tugas');
    } else if (current.pathname.startsWith('/surat-menyurat/')) {
        add('surat-menyurat.surat-masuk.index', {}, 'Surat Masuk');
    } else if (current.pathname.startsWith('/lpj-kepengurusan/')) {
        add('proker.index', {}, 'Program Kerja');
    }
    const segments = current.pathname.split('/').filter(Boolean);
    for (let index = 0; index < segments.length; index++) {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const parent = matchPage(path, routes, origin);
        if (!parent || parent.name === 'dashboard') continue;
        const parameter = Object.entries(parent.parameters).find(([, id]) => id === segments[index]);
        const scopedEntity = parameter && (page.props?.[parameter[0]] || (parameter[0] === 'pengumpulan' ? page.props?.riwayat : null));
        const entity = parameter && (scopedEntity?.id && String(scopedEntity.id) === parameter[1] ? scopedEntity : entities.find((entity) => String(entity.id) === parameter[1]));
        const label = entity ? String(entity[NAME_KEYS.find((key) => entity[key])] || 'Detail') : parameter ? 'Detail' : labelFor(segments[index]);
        add(parent.name, parent.parameters, label);
    }
    const last = items.at(-1);
    if (!last || internalUrl(last.href, origin)?.pathname !== current.pathname) items.push({ label: labelFor(segments.at(-1) || matched?.name || 'Halaman'), href: null });
    else last.href = null;
    const lab = (page.props?.laboratorium || []).find((item) => String(item.id) === context.lab_id);
    if (lab && !current.pathname.startsWith('/laboratorium') && !current.pathname.startsWith('/praktikan/')) items.unshift({ label: lab.nama, href: null });
    return items;
}
