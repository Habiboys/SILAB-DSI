import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ADMIN_AUTH_FILE = path.join(__dirname, '.auth/admin.json');
export const PRAKTIKAN_AUTH_FILE = path.join(__dirname, '.auth/praktikan.json');
export const ASISTEN_AUTH_FILE = path.join(__dirname, '.auth/asisten.json');
export const KALAB_AUTH_FILE = path.join(__dirname, '.auth/kalab.json');
export const KADEP_AUTH_FILE = path.join(__dirname, '.auth/kadep.json');
export const SUPERADMIN_AUTH_FILE = path.join(__dirname, '.auth/superadmin.json');
