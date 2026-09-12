import { Link } from '@inertiajs/react';

const VARIANTS = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost border border-base-300 bg-base-100',
    danger: 'btn-error',
    warning: 'btn-warning',
    success: 'btn-success',
    info: 'btn-info',
};

export default function Button({ href, variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
    const classes = `btn btn-${size} min-h-11 ${VARIANTS[variant] ?? variant} ${className}`;
    const content = <>{loading && <span className="loading loading-spinner loading-sm" />} {children}</>;
    return href
        ? <Link href={href} className={classes} {...props}>{content}</Link>
        : <button type="button" className={classes} disabled={disabled || loading} {...props}>{content}</button>;
}
