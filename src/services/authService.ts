import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import type { AppUser, CartItem } from '../types';
import { loadCart, saveCart } from './cartStorage';

const CURRENT_USER_KEY = 'customkaos_current_user_v1';
const LOCAL_USERS_KEY = 'customkaos_local_users_v1';
const USER_SAVED_DESIGNS_PREFIX = 'customkaos_saved_designs_';

export function getCurrentUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCurrentUser(user: AppUser | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('user-auth-changed', { detail: user }));
  }
}

// ─────────────────────────────────────────────
// Cloud / Local Cart Sync for Authenticated User
// ─────────────────────────────────────────────

export function getUserSavedDesigns(userId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(`${USER_SAVED_DESIGNS_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserDesigns(userId: string, designs: CartItem[]): void {
  try {
    const existing = getUserSavedDesigns(userId);
    // Merge existing user designs with new designs so deleting from active cart doesn't delete permanently saved designs
    const map = new Map<string, CartItem>();
    existing.forEach((d) => map.set(d.id, d));
    designs.forEach((d) => map.set(d.id, d));
    const merged = Array.from(map.values());
    localStorage.setItem(`${USER_SAVED_DESIGNS_PREFIX}${userId}`, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to save user designs:', err);
  }
}

export function syncCartOnLogin(user: AppUser): void {
  const guestCart = loadCart();
  const userDesigns = getUserSavedDesigns(user.id);

  // Merge guest cart with existing user saved designs (avoid duplicates by id)
  const existingIds = new Set(userDesigns.map((d) => d.id));
  const newFromGuest = guestCart.filter((d) => !existingIds.has(d.id));
  const mergedCart = [...guestCart, ...userDesigns.filter((d) => !guestCart.some((g) => g.id === d.id))];

  // Save back to both user designs and active cart
  if (newFromGuest.length > 0 || userDesigns.length > 0) {
    saveUserDesigns(user.id, mergedCart);
    saveCart(mergedCart);
  }
}

// ─────────────────────────────────────────────
// Auth Actions (Supabase with Local Fallback)
// ─────────────────────────────────────────────

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ user: AppUser | null; error: string | null }> {
  const { email, password, fullName, phone } = params;

  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone?.trim() || '',
            },
          },
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          const appUser: AppUser = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || fullName,
            phone: data.user.user_metadata?.phone || phone,
            createdAt: data.user.created_at,
          };
          saveCurrentUser(appUser);
          syncCartOnLogin(appUser);
          return { user: appUser, error: null };
        }
      } catch (err) {
        console.warn('Supabase signUp error:', err);
      }
    }
  }

  // Local fallback (offline or demo mode)
  try {
    const rawLocal = localStorage.getItem(LOCAL_USERS_KEY);
    const localUsers: Array<AppUser & { passwordHash: string }> = rawLocal ? JSON.parse(rawLocal) : [];

    if (localUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'Email sudah terdaftar. Silakan login.' };
    }

    const newUser: AppUser = {
      id: 'USR-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phone: phone?.trim(),
      createdAt: new Date().toISOString(),
    };

    localUsers.push({ ...newUser, passwordHash: btoa(password) });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));

    saveCurrentUser(newUser);
    syncCartOnLogin(newUser);
    return { user: newUser, error: null };
  } catch (err) {
    return { user: null, error: 'Gagal membuat akun lokal: ' + String(err) };
  }
}

export async function signInWithEmail(params: {
  email: string;
  password: string;
}): Promise<{ user: AppUser | null; error: string | null }> {
  const { email, password } = params;

  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          const appUser: AppUser = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            phone: data.user.user_metadata?.phone,
            createdAt: data.user.created_at,
          };
          saveCurrentUser(appUser);
          syncCartOnLogin(appUser);
          return { user: appUser, error: null };
        }
      } catch (err) {
        console.warn('Supabase signIn error:', err);
      }
    }
  }

  // Local fallback
  try {
    const rawLocal = localStorage.getItem(LOCAL_USERS_KEY);
    const localUsers: Array<AppUser & { passwordHash: string }> = rawLocal ? JSON.parse(rawLocal) : [];
    const matched = localUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === btoa(password)
    );

    if (!matched) {
      return { user: null, error: 'Email atau password salah.' };
    }

    const { passwordHash: _p, ...cleanUser } = matched;
    saveCurrentUser(cleanUser);
    syncCartOnLogin(cleanUser);
    return { user: cleanUser, error: null };
  } catch {
    return { user: null, error: 'Gagal login akun lokal.' };
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Integrasi Supabase belum dikonfigurasi untuk Google OAuth.' };
  }
  const sb = getSupabase();
  if (!sb) return { error: 'Klien Supabase tidak tersedia.' };

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { error: error ? error.message : null };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
  }
  saveCurrentUser(null);
}

export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  // Initial call with cached user
  callback(getCurrentUser());

  // Supabase listener if configured
  let supabaseUnsubscribe: (() => void) | null = null;
  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    if (sb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            phone: session.user.user_metadata?.phone,
            createdAt: session.user.created_at,
          };
          saveCurrentUser(appUser);
          callback(appUser);
        } else {
          saveCurrentUser(null);
          callback(null);
        }
      });
      supabaseUnsubscribe = () => data.subscription.unsubscribe();
    }
  }

  // Window custom event listener
  const handleAuthChange = (e: Event) => {
    const customEvent = e as CustomEvent<AppUser | null>;
    callback(customEvent.detail);
  };
  window.addEventListener('user-auth-changed', handleAuthChange);

  return () => {
    if (supabaseUnsubscribe) supabaseUnsubscribe();
    window.removeEventListener('user-auth-changed', handleAuthChange);
  };
}

