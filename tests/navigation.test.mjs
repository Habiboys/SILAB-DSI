import test from 'node:test';
import assert from 'node:assert/strict';
import { backDestination, buildBreadcrumbs, internalUrl, matchPage, navigationContext, recordPage, restoreParent, withContext } from '../resources/js/Utils/navigation.js';

const origin = 'http://localhost';
const definitions = {
    dashboard: 'dashboard', 'kegiatan.index': 'kegiatan', 'kegiatan.create': 'kegiatan/create',
    'kegiatan.show': 'kegiatan/{kegiatan}', 'kegiatan.edit': 'kegiatan/{kegiatan}/edit',
    'kegiatan.sertifikat': 'kegiatan/{kegiatan}/sertifikat', 'praktikum.index': 'praktikum',
    'praktikum.show': 'praktikum/{praktikum}', 'praktikum.tugas.index': 'praktikum/{praktikum}/tugas',
    'praktikum.tugas.submissions': 'praktikum/tugas/{tugas}/submissions',
    'praktikum.tugas.komponen.index': 'praktikum/tugas/{tugas}/komponen',
    'praktikan.daftar-tugas': 'praktikan/daftar-tugas', 'praktikan.praktikum.tugas': 'praktikan/praktikum/{praktikum}/tugas',
    'praktikan.riwayat.praktikum': 'praktikan/riwayat-tugas/praktikum/{praktikum}',
    'praktikan.riwayat.show': 'praktikan/riwayat-tugas/{pengumpulan}',
    'data-master.struktur.index': 'data-master/struktur', 'login': 'login',
    'kegiatan.export': 'kegiatan/export',
};
const routes = Object.fromEntries(Object.entries(definitions).map(([name, uri]) => [name, { uri, methods: ['GET', 'HEAD'] }]));
routes['kegiatan.store'] = { uri: 'kegiatan', methods: ['POST'] };
const makeRoute = (name, params = {}) => '/' + definitions[name].replace(/\{(\w+)\}/g, (_, key) => {
    assert.ok(params[key], `Missing ${key}`);
    return params[key];
});
const page = (url, lab = 'a', extra = {}) => ({ url, props: { navigation_context: { lab_id: lab, kepengurusan_lab_id: `period-${lab}` }, ...extra } });
const crumbs = (value, history = []) => buildBreadcrumbs(value, routes, makeRoute, history, origin);

test('static routes take precedence over entity placeholders', () => {
    assert.equal(matchPage('/kegiatan/create', routes, origin).name, 'kegiatan.create');
});
test('unregistered prefixes are never clickable breadcrumbs', () => {
    const result = crumbs(page('/data-master/struktur'));
    assert.deepEqual(result.map(item => item.label), ['Struktur']);
    assert.equal(result[0].href, null);
});
test('external, malformed entity IDs, auth, export and mutation routes cannot become return targets', () => {
    for (const url of ['https://external.test/kegiatan', '/kegiatan/undefined', '/kegiatan/null', '/login']) assert.equal(matchPage(url, routes, origin), null);
    assert.equal(internalUrl('javascript:alert(1)', origin), null);
    assert.equal(matchPage('/kegiatan/export', { 'kegiatan.export': routes['kegiatan.export'] }, origin), null);
});
test('detail breadcrumbs show the entity name and retain context', () => {
    const result = crumbs(page('/kegiatan/id-a', 'a', { kegiatan: { id: 'id-a', nama_kegiatan: 'Pelatihan Robot' } }));
    assert.equal(result.at(-1).label, 'Pelatihan Robot');
    assert.equal(result.at(-1).href, null);
    assert.match(result[0].href, /lab_id=a/);
    assert.match(result[0].href, /kepengurusan_lab_id=period-a/);
});
test('parent breadcrumbs restore the exact search, pagination and filter URL', () => {
    const list = page('/kegiatan?lab_id=a&search=robot&page=3&status=diajukan');
    const history = recordPage([], list, origin);
    assert.equal(crumbs(page('/kegiatan/id-a'), history)[0].href, list.url);
});
test('back returns to the actual internal origin, including a different module', () => {
    const history = recordPage([], page('/praktikum?lab_id=a&page=2'), origin);
    assert.equal(backDestination(page('/kegiatan/id-a'), '/kegiatan', history, routes, origin), '/praktikum?lab_id=a&page=2');
});
test('direct access uses a valid contextual parent fallback', () => {
    assert.equal(backDestination(page('/kegiatan/id-a'), '/kegiatan', [], routes, origin), '/kegiatan?lab_id=a&kepengurusan_lab_id=period-a');
});
test('invalid or external fallbacks resolve to dashboard', () => {
    assert.match(backDestination(page('/kegiatan/id-a'), 'https://external.test/', [], routes, origin), /^\/dashboard\?/);
    assert.match(backDestination(page('/kegiatan/id-a'), '/missing-parent', [], routes, origin), /^\/dashboard\?/);
});
test('cancel uses the business parent instead of unrelated history', () => {
    const history = recordPage([], page('/praktikum?lab_id=a'), origin);
    assert.match(backDestination(page('/kegiatan/create'), '/kegiatan', history, routes, origin, 'cancel'), /^\/kegiatan\?/);
});
test('history cannot cross laboratories or periods', () => {
    const history = recordPage([], page('/kegiatan?lab_id=b&page=8', 'b'), origin);
    assert.doesNotMatch(backDestination(page('/kegiatan/id-a'), '/kegiatan', history, routes, origin), /page=8|lab_id=b/);
});
test('refresh and same-page filtering preserve the original parent', () => {
    let history = recordPage([], page('/kegiatan?lab_id=a&page=2'), origin);
    history = recordPage(history, page('/kegiatan/id-a'), origin);
    history = recordPage(history, page('/kegiatan/id-a?tab=peserta'), origin);
    history = recordPage(history, page('/kegiatan/id-a?tab=peserta'), origin);
    assert.equal(history.length, 2);
    assert.equal(backDestination(page('/kegiatan/id-a?tab=peserta'), '/kegiatan', history, routes, origin), '/kegiatan?lab_id=a&page=2');
});
test('returning to ancestors prunes loops and handles browser back and forward', () => {
    let history = recordPage([], page('/kegiatan?lab_id=a&page=2'), origin);
    history = recordPage(history, page('/kegiatan/id-a'), origin);
    history = recordPage(history, page('/kegiatan/id-a/sertifikat'), origin);
    history = recordPage(history, page('/kegiatan/id-a'), origin);
    assert.equal(history.length, 2);
    history = recordPage(history, page('/kegiatan/id-a/sertifikat'), origin);
    assert.equal(history.length, 3);
});
test('back skips edit/create pages and descendant loops', () => {
    let history = recordPage([], page('/kegiatan?lab_id=a'), origin);
    for (const url of ['/kegiatan/id-a', '/kegiatan/id-a/edit']) history = recordPage(history, page(url), origin);
    assert.equal(backDestination(page('/kegiatan/id-a'), '/kegiatan', history, routes, origin), '/kegiatan?lab_id=a');
});
test('explicit laboratory and period switches do not inherit conflicting IDs', () => {
    assert.equal(withContext('/kegiatan?lab_id=b', { lab_id: 'a', kepengurusan_lab_id: 'period-a' }, origin), '/kegiatan?lab_id=b');
    assert.equal(withContext('/kegiatan?kepengurusan_lab_id=period-b', { lab_id: 'a', kepengurusan_lab_id: 'period-a' }, origin), '/kegiatan?kepengurusan_lab_id=period-b');
});
test('backend entity context wins over stale query and selected laboratory state', () => {
    assert.deepEqual(navigationContext(page('/kegiatan/id-a?lab_id=b&kepengurusan_lab_id=period-b')), { lab_id: 'a', kepengurusan_lab_id: 'period-a' });
});
test('task breadcrumbs reconstruct hierarchy absent from the URL', () => {
    const result = crumbs(page('/praktikum/tugas/task-a/komponen', 'a', { tugas: { id: 'task-a', judul_tugas: 'Tugas 1', praktikum: { id: 'class-a', mata_kuliah: 'Algoritma' } } }));
    assert.deepEqual(result.map(item => item.label), ['Praktikum', 'Algoritma', 'Tugas', 'Tugas 1', 'Komponen Rubrik']);
    for (const item of result.filter(item => item.href)) assert.ok(matchPage(item.href, routes, origin));
});
test('student submission history has its own classroom parent on direct access', () => {
    const result = crumbs(page('/praktikan/riwayat-tugas/submission-a', 'a', { riwayat: { id: 'submission-a', tugasPraktikum: { id: 'task-a', judul_tugas: 'Tugas 1', praktikum: { id: 'class-a', mata_kuliah: 'Algoritma' } } } }));
    assert.ok(result.some(item => item.href?.includes('/praktikan/riwayat-tugas/praktikum/class-a')));
});
test('stored laboratory filters cannot overwrite a different entity context', () => {
    const history = recordPage([], page('/kegiatan?lab_id=b&search=secret', 'b'), origin);
    assert.doesNotMatch(restoreParent('/kegiatan', page('/kegiatan/id-a'), history, origin), /secret|lab_id=b/);
});

test('direct task access preserves classroom context and rejects a stored different class', () => {
    const current = page('/praktikum/tugas/task-a/komponen?kelas_id=class-b&context_kelas_id=class-b');
    const history = recordPage([], page('/praktikum/practicum-a/tugas?kelas_id=class-a&context_kelas_id=class-a'), origin);
    const target = restoreParent('/praktikum/practicum-a/tugas', current, history, origin);
    assert.match(target, /kelas_id=class-b/);
    assert.doesNotMatch(target, /class-a/);
});
