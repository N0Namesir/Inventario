import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-800 border border-surface-700 rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-modal"
      >
        <div className="flex justify-between items-center mb-6">
          {title && <h2 className="m-0 text-xl font-semibold text-slate-100">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto text-slate-500 hover:text-slate-200 text-2xl leading-none bg-transparent border-none cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
