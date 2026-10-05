import { Link } from '@inertiajs/react';

const VARIANTS = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    danger: 'btn-error',
    warning: 'btn-warning',
    success: 'btn-success',
    info: 'btn-info',
    neutral: 'btn-neutral',
};

export default function Button({ href, variant = 'primary', size = 'md', loading = false, className = '', children, disabled, external = false, type = 'button', ...props }) {
    const classes = `btn btn-${size} min-h-11 ${VARIANTS[variant] ?? variant} ${className}`;
    const content = <>{loading && <span className="loading loading-spinner loading-sm" />} {children}</>;
    if (href && (disabled || loading)) {
        return <button {...props} type={type} className={classes} disabled aria-busy={loading || undefined}>{content}</button>;
    }
    return href
        ? (external
            ? <a href={href} className={classes} {...props}>{content}</a>
            : <Link href={href} className={classes} {...props}>{content}</Link>)
        : <button type={type} className={classes} disabled={disabled || loading} {...props}>{content}</button>;
}
