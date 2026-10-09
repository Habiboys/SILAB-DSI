import { usePage } from '@inertiajs/react';

export function useKepengurusanAccess() {
    const { kepengurusan_context: context } = usePage().props;
    return {
        isReadOnly: context?.is_read_only === true,
        canMutate: context ? context.is_active === true : true,
        periodId: context?.id,
    };
}

export function useMutationPermissions(permissions = {}) {
    const { canMutate } = useKepengurusanAccess();
    return Object.fromEntries(Object.entries(permissions).map(([key, value]) => [
        key, /^(view|export|download|read)/i.test(key) ? value : value && canMutate,
    ]));
}
