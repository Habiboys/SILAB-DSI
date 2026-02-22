import { usePage } from '@inertiajs/react';
import { createContext } from 'react';

const PermissionContext = createContext(null);

/**
 * Custom hook to check permissions and roles on the frontend.
 * Uses the 'auth' prop shared via Inertia HandleInertiaRequests middleware.
 */
export function usePermission() {
    const { auth } = usePage().props;
    const user = auth?.user;

    /**
     * Check if user has a specific permission
     * @param {string} permission - The permission name to check (e.g. 'praktikum.create')
     * @returns {boolean}
     */
    const can = (permission) => {
        if (!user) return false;
        
        // Superadmin always has all permissions
        if (user.roles && user.roles.includes('superadmin')) {
            return true;
        }

        // Check permissions array
        if (user.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(permission);
        }

        return false;
    };

    /**
     * Check if user has a specific role
     * @param {string|string[]} roles - Role name or array of role names
     * @returns {boolean}
     */
    const hasRole = (roles) => {
        if (!user || !user.roles) return false;
        
        if (Array.isArray(roles)) {
            return roles.some(role => user.roles.includes(role));
        }
        
        return user.roles.includes(roles);
    };

    /**
     * Check if user has ANY of the given permissions
     * @param {string[]} permissions 
     * @returns {boolean}
     */
    const canAny = (permissions) => {
        if (!Array.isArray(permissions)) return false;
        return permissions.some(p => can(p));
    };

    /**
     * Check if user has ALL of the given permissions
     * @param {string[]} permissions 
     * @returns {boolean}
     */
    const canAll = (permissions) => {
        if (!Array.isArray(permissions)) return false;
        return permissions.every(p => can(p));
    };

    return { 
        user, 
        can, 
        hasRole,
        canAny,
        canAll,
        // Helper specifically for our app structure
        isSuperAdmin: () => hasRole('superadmin'),
        isAdmin: () => hasRole(['admin', 'superadmin', 'kadep']),
        isAslab: () => hasRole('asisten'),
        isPraktikan: () => hasRole('praktikan'),
        isKadep: () => hasRole('kadep')
    };
}
