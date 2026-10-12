import test from 'node:test';
import assert from 'node:assert/strict';
import { firstMessage, flashNotification, installNotifications } from '../resources/js/Utils/notifications.js';

function setup(initialPage = {}) {
    const handlers = new Map();
    const messages = [];
    const router = { on: (name, fn) => { handlers.set(name, fn); return () => handlers.delete(name); } };
    const toast = Object.fromEntries(['success', 'error', 'warning'].map(type => [type, message => messages.push({ type, message })]));
    const dispose = installNotifications(router, toast, initialPage);
    return { messages, dispose, emit: (name, detail) => handlers.get(name)?.({ detail }) };
}

test('backend flash is shown once across navigate, success and history replay', () => {
    const state = setup();
    const page = { url: '/categories', props: { flash: { id: 'one', message: 'Kategori aset berhasil dihapus' } } };
    state.emit('start', { visit: { method: 'delete' } });
    state.emit('navigate', { page });
    state.emit('success', { page });
    state.emit('navigate', { page });
    assert.deepEqual(state.messages, [{ type: 'success', message: 'Kategori aset berhasil dihapus' }]);
});

test('identical messages from separate actions are both shown', () => {
    const state = setup();
    for (const id of ['one', 'two']) {
        state.emit('start', { visit: { method: 'post' } });
        state.emit('success', { page: { props: { flash: { id, success: 'Tersimpan' } } } });
    }
    assert.equal(state.messages.length, 2);
});

test('nested validation errors produce one message', () => {
    const state = setup();
    state.emit('start', { visit: { method: 'post' } });
    state.emit('error', { errors: { bag: { nama: ['Nama wajib diisi'], deskripsi: 'Deskripsi salah' } } });
    assert.deepEqual(state.messages, [{ type: 'error', message: 'Nama wajib diisi' }]);
    assert.equal(firstMessage(null), '');
});

test('backend error takes priority and suppresses secondary validation notification', () => {
    const state = setup();
    const page = { props: { flash: { id: 'failed', error: 'Tidak dapat dihapus', message: 'Tersimpan' } } };
    state.emit('start', { visit: { method: 'delete' } });
    state.emit('navigate', { page });
    state.emit('error', { errors: { nama: 'Gagal' } });
    assert.deepEqual(state.messages, [{ type: 'error', message: 'Tidak dapat dihapus' }]);
    assert.equal(flashNotification({}), null);
});

test('GET requests do not claim success; mutations without flash have one fallback', () => {
    const state = setup();
    state.emit('start', { visit: { method: 'get' } });
    state.emit('success', { page: {} });
    assert.equal(state.messages.length, 0);
    state.emit('start', { visit: { method: 'put' } });
    state.emit('success', { page: {} });
    assert.deepEqual(state.messages, [{ type: 'success', message: 'Perubahan berhasil disimpan.' }]);
    state.dispose();
    state.emit('error', { errors: { nama: 'Tidak ditampilkan' } });
    assert.equal(state.messages.length, 1);
});
