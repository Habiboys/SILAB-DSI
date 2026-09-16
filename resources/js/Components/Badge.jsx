const TONES = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    neutral: 'badge-neutral',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    ghost: 'badge-ghost',
    outline: 'badge-outline',
};

const SIZES = { xs: 'badge-xs', sm: 'badge-sm', md: 'badge-md', lg: 'badge-lg' };

export default function Badge({ tone = 'neutral', size = 'sm', className = '', children, ...props }) {
    return (
        <span className={`badge ${SIZES[size] ?? SIZES.sm} ${TONES[tone] ?? TONES.neutral} ${className}`} {...props}>
            {children}
        </span>
    );
}
