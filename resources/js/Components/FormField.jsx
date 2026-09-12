import InputError from './InputError';

export default function FormField({ label, error, hint, children, className = '', required = false }) {
    return (
        <label className={`fieldset w-full ${className}`}>
            {label && <span className="fieldset-legend">{label}{required && <span className="text-error"> *</span>}</span>}
            {children}
            {hint && !error && <span className="fieldset-label">{hint}</span>}
            <InputError message={error} />
        </label>
    );
}
