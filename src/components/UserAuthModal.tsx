import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../services/authService';
import type { AppUser } from '../types';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AppUser) => void;
  initialMode?: 'login' | 'register';
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail({ email, password });
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setSuccessMsg(`Selamat datang kembali, ${res.user.fullName || res.user.email}!`);
          if (onSuccess) onSuccess(res.user);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Mohon isi nama lengkap Anda.');
          setIsLoading(false);
          return;
        }
        const res = await signUpWithEmail({ email, password, fullName, phone });
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setSuccessMsg(`Akun berhasil dibuat! Desain keranjang Anda otomatis tersimpan.`);
          if (onSuccess) onSuccess(res.user);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (res.error) {
      if (
        res.error.toLowerCase().includes('provider is not enabled') ||
        res.error.toLowerCase().includes('unsupported provider')
      ) {
        setErrorMsg(
          'Login Google belum diaktifkan di Dashboard Supabase (Authentication > Providers > Google). Silakan gunakan pendaftaran via Email & Password di atas.'
        );
      } else {
        setErrorMsg(res.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 relative animate-in zoom-in-95 duration-150 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-1">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
            {mode === 'login' ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Pelanggan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {mode === 'login'
              ? 'Akses desain yang tersimpan di keranjang & pantau riwayat seluruh pesanan Anda.'
              : 'Simpan desain kaos Anda secara permanen dan lacak status pesanan dalam satu tempat.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-sky-600 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-sky-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-sky-600 transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nomor WhatsApp / HP (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-sky-600 transition font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftar & Simpan Desain</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
            atau
          </span>
        </div>

        {/* Google OAuth (if configured) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Guest Assurance Note */}
        <div className="text-center pt-1">
          <p className="text-[11px] text-slate-500">
            Tetap ingin langsung pesan tanpa akun?{' '}
            <button
              type="button"
              onClick={onClose}
              className="text-sky-600 hover:text-sky-700 font-bold underline cursor-pointer"
            >
              Lanjut sebagai Tamu (Guest)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

