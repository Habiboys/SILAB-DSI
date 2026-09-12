import { Accessibility, Minus, Moon, Plus, RotateCcw, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SCALES = [
  { label: 'Kecil', value: 14 },
  { label: 'Normal', value: 16 },
  { label: 'Besar', value: 18 },
  { label: 'Sangat besar', value: 20 },
];

const initialTheme = () => {
  const saved = localStorage.getItem('silabTheme');
  if (saved === 'silab' || saved === 'silab-dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'silab-dark' : 'silab';
};

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('silabFontSize')) || 16);
  const [theme, setTheme] = useState(initialTheme);
  const rootRef = useRef(null);
  const index = Math.max(0, SCALES.findIndex((item) => item.value === fontSize));
  const dark = theme === 'silab-dark';

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem('silabFontSize', String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('silabTheme', theme);
  }, [theme]);

  useEffect(() => {
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const escape = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const step = (direction) => {
    const next = Math.min(SCALES.length - 1, Math.max(0, index + direction));
    setFontSize(SCALES[next].value);
  };

  return (
    <div ref={rootRef} className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
        aria-label="Kemudahan tampilan"
        title="Kemudahan tampilan"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Accessibility size={18} className="text-primary" aria-hidden="true" />
      </button>

      {open && (
        <div className="dropdown-content right-0 z-50 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-base-300 pb-3">
            <Accessibility size={18} className="text-primary" aria-hidden="true" />
            <p className="font-semibold">Kemudahan tampilan</p>
          </div>

          <p className="mt-4 text-sm font-medium">Tema</p>
          <div className="join mt-2 grid grid-cols-2">
            <button type="button" className={`btn join-item min-h-11 ${!dark ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('silab')}>
              <Sun size={16} aria-hidden="true" /> Terang
            </button>
            <button type="button" className={`btn join-item min-h-11 ${dark ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTheme('silab-dark')}>
              <Moon size={16} aria-hidden="true" /> Gelap
            </button>
          </div>

          <div className="divider my-3" />
          <p className="text-sm font-medium">Ukuran huruf</p>
          <p className="mt-1 text-xs text-base-content/60">Sesuaikan ukuran teks untuk seluruh aplikasi.</p>
          <div className="join mt-3 flex w-full">
            <button type="button" className="btn btn-outline join-item min-h-11 flex-1" onClick={() => step(-1)} disabled={index <= 0} aria-label="Kecilkan huruf">
              <Minus size={16} aria-hidden="true" />
            </button>
            <span className="btn btn-outline join-item min-h-11 flex-1 cursor-default">{SCALES[index]?.label}</span>
            <button type="button" className="btn btn-outline join-item min-h-11 flex-1" onClick={() => step(1)} disabled={index >= SCALES.length - 1} aria-label="Perbesar huruf">
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="btn btn-ghost btn-sm mt-3 min-h-11 w-full" onClick={() => { setFontSize(16); setTheme('silab'); }}>
            <RotateCcw size={15} aria-hidden="true" /> Atur ulang tampilan
          </button>
        </div>
      )}
    </div>
  );
}
