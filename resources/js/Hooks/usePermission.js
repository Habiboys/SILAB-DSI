import { usePage } from '@inertiajs/react';

/**
 * Custom hook for checking permissions in the frontend
 * 
 * Usage:
 * const { can, hasRole, hasPosition, isKalab } = usePermission();
 * 
 * if (can('praktikum.create')) {
 *   // Show create button
 * }
 * 
 * if (isKalab()) {
 *   // Show kalab-only actions
 * }
 */
export function usePermission() {
    const { auth } = usePage().props;

    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission name (e.g., 'praktikum.create')
     * @returns {boolean}
     */
    const can = (permission) => {
        if (!auth.user) return false;
        return auth.user.permissions.includes(permission);
    };

    /**
     * Check if user has any of the specified roles
     * @param {string|string[]} role - Role name or array of role names
     * @returns {boolean}
     */
    const hasRole = (role) => {
        if (!auth.user) return false;
        const roles = Array.isArray(role) ? role : [role];
        return roles.some(r => auth.user.roles.includes(r));
    };

    /**
     * Check if user has a specific position (jabatan)
     * @param {string} position - Position name (e.g., 'Kalab', 'Sekretaris')
     * @returns {boolean}
     */
    const hasPosition = (position) => {
        if (!auth.user) return false;
        return auth.user.current_position === position;
    };

    /**
     * Check if user is Kalab or Wakil Kalab
     * @returns {boolean}
     */
    const isKalab = () => {
        if (!auth.user) return false;
        return auth.user.is_kalab === true;
    };

    /**
     * Check if user is Super Admin
     * @returns {boolean}
     */
    const isSuperAdmin = () => hasRole('superadmin');

    /**
     * Check if user is Kadep
     * @returns {boolean}
     */
    const isKadep = () => hasRole('kadep');

    /**
     * Check if user is Admin
     * @returns {boolean}
     */
    const isAdmin = () => hasRole('admin');

    /**
     * Check if user is Asisten
     * @returns {boolean}
     */
    const isAsisten = () => hasRole('asisten');

    /**
     * Check if user is Praktikan
     * @returns {boolean}
     */
    const isPraktikan = () => hasRole('praktikan');

    /**
     * Check if user can perform any of the specified permissions
     * @param {string[]} permissions - Array of permission names
     * @returns {boolean}
     */
    const canAny = (permissions) => {
        if (!auth.user) return false;
        return permissions.some(permission => can(permission));
    };

    /**
     * Check if user can perform all of the specified permissions
     * @param {string[]} permissions - Array of permission names
     * @returns {boolean}
     */
    const canAll = (permissions) => {
        if (!auth.user) return false;
        return permissions.every(permission => can(permission));
    };

    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasPosition,
        isKalab,
        isSuperAdmin,
        isKadep,
        isAdmin,
        isAsisten,
        isPraktikan,
    };
}
