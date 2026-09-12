import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    daisyui: {
        themes: [
            {
                silab: {
                    primary: '#2563eb',
                    'primary-content': '#ffffff',
                    secondary: '#0f766e',
                    'secondary-content': '#ffffff',
                    accent: '#93c5fd',
                    'accent-content': '#0f172a',
                    neutral: '#1e293b',
                    'neutral-content': '#f8fafc',
                    'base-100': '#ffffff',
                    'base-200': '#f1f5f9',
                    'base-300': '#cbd5e1',
                    'base-content': '#172033',
                    info: '#0369a1',
                    'info-content': '#ffffff',
                    success: '#15803d',
                    'success-content': '#ffffff',
                    warning: '#b45309',
                    'warning-content': '#ffffff',
                    error: '#b91c1c',
                    'error-content': '#ffffff',
                    '--rounded-box': '0.375rem',
                    '--rounded-btn': '0.375rem',
                    '--rounded-badge': '9999px',
                    '--animation-btn': '0.15s',
                    '--animation-input': '0.15s',
                    '--btn-focus-scale': '0.98',
                    '--border-btn': '1px',
                    '--tab-border': '1px',
                    '--tab-radius': '0.375rem',
                },
            },
            {
                'silab-dark': {
                    primary: '#3b82f6',
                    'primary-content': '#ffffff',
                    secondary: '#2dd4bf',
                    'secondary-content': '#042f2e',
                    accent: '#60a5fa',
                    'accent-content': '#0f172a',
                    neutral: '#cbd5e1',
                    'neutral-content': '#0f172a',
                    'base-100': '#0f172a',
                    'base-200': '#111c30',
                    'base-300': '#334155',
                    'base-content': '#f1f5f9',
                    info: '#38bdf8',
                    'info-content': '#082f49',
                    success: '#4ade80',
                    'success-content': '#052e16',
                    warning: '#fbbf24',
                    'warning-content': '#422006',
                    error: '#f87171',
                    'error-content': '#450a0a',
                    '--rounded-box': '0.375rem',
                    '--rounded-btn': '0.375rem',
                    '--rounded-badge': '9999px',
                    '--animation-btn': '0.15s',
                    '--animation-input': '0.15s',
                    '--btn-focus-scale': '0.98',
                    '--border-btn': '1px',
                    '--tab-border': '1px',
                    '--tab-radius': '0.375rem',
                },
            },
        ],
        darkTheme: 'silab-dark',
    },

    plugins: [forms, daisyui],
};
