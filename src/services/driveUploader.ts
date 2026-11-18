/**
 * Google Drive uploader service.
 * Sends order data + images to a deployed Google Apps Script Web App,
 * which creates folders in the admin's Google Drive.
 */

import { dataUrlToBase64 } from './imageUtils';

// ── Types ──

export interface DriveUploadPayload {
  orderId: string;
  orderDetails: string; // Formatted text summary of the order
  mockupPreview?: string; // base64 data URL (primary thumbnail)
  mockupPreviews?: {
    view: string; // 'front' | 'back' | 'sleeve-left' | 'sleeve-right'
    dataUrl: string; // base64 data URL
  }[];
  designFiles?: {
    fileName: string;
    dataUrl: string; // base64 data URL
    view: string; // 'front' | 'back' | etc.
  }[];
}

export interface DriveUploadResult {
  success: boolean;
  folderId?: string;
  folderUrl?: string;
  orderId?: string;
  filesUploaded?: number;
  error?: string;
}

// ── Config helpers ──

const STORAGE_KEY = 'customkaos_apps_script_url';

export function getAppsScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setAppsScriptUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

export function isDriveConfigured(): boolean {
  return !!getAppsScriptUrl();
}

// ── Upload ──

export async function uploadOrderToDrive(
  payload: DriveUploadPayload
): Promise<DriveUploadResult> {
  const scriptUrl = getAppsScriptUrl();
  if (!scriptUrl) {
    return {
      success: false,
      error: 'Google Apps Script URL belum dikonfigurasi di Admin → Product Database.',
    };
  }

  try {
    // Build the JSON body. Strip data URL prefixes → raw base64.
    const body = {
      orderId: payload.orderId,
      orderDetails: payload.orderDetails,
      mockupPreview: payload.mockupPreview
        ? dataUrlToBase64(payload.mockupPreview)
        : undefined,
      mockupPreviews: payload.mockupPreviews?.map((m) => ({
        view: m.view,
        base64: dataUrlToBase64(m.dataUrl),
      })),
      designFiles: payload.designFiles?.map((f) => ({
        fileName: f.fileName,
        base64: dataUrlToBase64(f.dataUrl),
        view: f.view,
      })),
    };

    // Use text/plain to avoid CORS preflight (Apps Script doesn't handle OPTIONS)
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const result: DriveUploadResult = await response.json();
    return result;
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Upload ke Google Drive gagal (network error).',
    };
  }
}

