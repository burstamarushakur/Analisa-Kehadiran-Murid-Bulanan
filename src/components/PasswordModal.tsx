import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { validatePassword } from '../services/api';

interface PasswordModalProps {
  classId: string;
  className: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasswordModal({ classId, className, isOpen, onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const isValid = await validatePassword(classId, password);
      
      if (isValid) {
        setPassword('');
        onSuccess();
      } else {
        setError('Kata laluan salah. Sila cuba lagi.');
      }
    } catch (err: any) {
      setError(err.message || 'Ralat sambungan sistem. Sila cuba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Pengesahan Guru</h2>
        <p className="text-sm text-slate-500 mb-6">
          Sila masukkan kata laluan bagi mengakses kelas <span className="font-bold text-slate-800">{className}</span>.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="password"
            autoFocus
            placeholder="Kata Laluan Kelas"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            disabled={isSubmitting}
            className={cn(
              "w-full border-2 rounded-xl px-4 py-3 text-center text-lg mb-4 outline-none transition-all",
              error ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900" : "border-slate-200 focus:border-blue-500",
              isSubmitting && "opacity-50 cursor-not-allowed"
            )}
          />
          {error && <p className="text-red-500 text-xs font-bold mb-3 -mt-2">{error}</p>}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> MENGESAH...
              </>
            ) : "MASUK KELAS"}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full mt-2 text-slate-400 text-sm font-semibold py-2 hover:text-slate-600 transition-colors"
          >
            BATAL
          </button>
        </form>
      </div>
    </div>
  );
}
