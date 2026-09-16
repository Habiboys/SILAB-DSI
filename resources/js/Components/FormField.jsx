import InputError from './InputError';

/**
 * Satu kontrak spacing untuk semua form: legend -> control -> hint/error.
 * Padding bawaan fieldset sudah dinormalisasi di app.css, jadi jarak antar
 * field cukup diatur oleh container (space-y-*), bukan oleh tiap field.
 */
export default function FormField({ label, error, hint, children, className = '', required = false }) {
    return (
        <label className={`fieldset w-full gap-1.5 ${className}`}>
            {label && (
                <span className="fieldset-legend text-sm">
                    {label}
                    {required && <span className="text-error"> *</span>}
                </span>
            )}
            {children}
            {hint && !error && <span className="fieldset-label text-xs">{hint}</span>}
            <InputError message={error} />
        </label>
    );
}
