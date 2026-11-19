export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  holderName: string;
  notes?: string;
}

const BANK_STORAGE_KEY = 'customkaos_bank_config_v1';

export const DEFAULT_BANK_ACCOUNTS: BankAccountInfo[] = [
  {
    bankName: 'BCA',
    accountNumber: '895356338321',
    holderName: 'Custom Apparel Bandung',
    notes: 'Transfer via BCA M-Banking / ATM',
  },
  {
    bankName: 'Mandiri',
    accountNumber: '1310089535633',
    holderName: 'Custom Apparel Bandung',
    notes: 'Transfer via Livin Mandiri / ATM',
  },
];

export function getBankAccounts(): BankAccountInfo[] {
  try {
    const raw = localStorage.getItem(BANK_STORAGE_KEY);
    if (!raw) return DEFAULT_BANK_ACCOUNTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_BANK_ACCOUNTS;
  } catch {
    return DEFAULT_BANK_ACCOUNTS;
  }
}

export function saveBankAccounts(accounts: BankAccountInfo[]): void {
  try {
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save bank accounts:', err);
  }
}

