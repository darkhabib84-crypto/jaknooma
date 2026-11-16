import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ListingReport {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  reason: 'inappropriate' | 'spam_scam' | 'misleading' | 'other';
  reasonLabelAr: string;
  reasonLabelEn: string;
  notes: string;
  createdAt: string;
  status: 'pending' | 'dismissed' | 'resolved_deleted' | 'resolved_banned';
  reporterId?: string;
  reporterEmail?: string;
}

export interface BannedSellerRecord {
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  bannedAt: string;
  reason?: string;
}

const LOCAL_REPORTS_KEY = 'jaknooma_reports_v1';
const LOCAL_BANNED_USERS_KEY = 'jaknooma_banned_users_v1';
const LOCAL_DELETED_PRODUCTS_KEY = 'jaknooma_deleted_products_v1';
export const MODERATION_EVENT = 'jaknooma-moderation-updated';

function emitModerationUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MODERATION_EVENT));
  }
}

export function getLocalReports(): ListingReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReports(reports: ListingReport[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
    emitModerationUpdate();
  } catch {
    // ignore storage errors
  }
}

export function getLocalBannedUsers(): BannedSellerRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_BANNED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalBannedUsers(banned: BannedSellerRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_BANNED_USERS_KEY, JSON.stringify(banned));
    emitModerationUpdate();
  } catch {
    // ignore
  }
}

export function getLocalDeletedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DELETED_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLocalDeletedProductIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const existing = new Set(getLocalDeletedProductIds());
    ids.forEach((id) => {
      if (id) existing.add(id);
    });
    window.localStorage.setItem(LOCAL_DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(existing)));
    emitModerationUpdate();
  } catch {
    // ignore
  }
}

export function isSellerOrProductHidden(product: {
  id?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
}): boolean {
  if (!product) return false;
  const deletedIds = getLocalDeletedProductIds();
  if (product.id && deletedIds.includes(product.id)) {
    return true;
  }

  const bannedList = getLocalBannedUsers();
  if (bannedList.length === 0) return false;

  const sId = (product.sellerId || '').trim().toLowerCase();
  const sName = (product.sellerName || '').trim().toLowerCase();
  const sEmail = (product.sellerEmail || '').trim().toLowerCase();

  return bannedList.some((b) => {
    const bId = (b.sellerId || '').trim().toLowerCase();
    const bName = (b.sellerName || '').trim().toLowerCase();
    const bEmail = (b.sellerEmail || '').trim().toLowerCase();
    return (
      (sId && bId && sId === bId) ||
      (sEmail && bEmail && sEmail === bEmail) ||
      (sName && bName && sName !== 'anonymous seller' && sName === bName)
    );
  });
}

export function isUserBannedSync(uid?: string | null, email?: string | null): boolean {
  if (!uid && !email) return false;
  const bannedList = getLocalBannedUsers();
  const cleanUid = (uid || '').trim().toLowerCase();
  const cleanEmail = (email || '').trim().toLowerCase();
  return bannedList.some((b) => {
    const bId = (b.sellerId || '').trim().toLowerCase();
    const bEmail = (b.sellerEmail || '').trim().toLowerCase();
    return (cleanUid && bId === cleanUid) || (cleanEmail && bEmail === cleanEmail);
  });
}

export async function checkUserBannedAsync(uid?: string | null, email?: string | null): Promise<boolean> {
  if (!uid && !email) return false;
  if (isUserBannedSync(uid, email)) return true;

  try {
    // Check settings/moderation_bans (publicly readable)
    const modSnap = await getDoc(doc(db, 'settings', 'moderation_bans'));
    if (modSnap.exists()) {
      const data = modSnap.data();
      if (Array.isArray(data.bannedUsers)) {
        saveLocalBannedUsers(data.bannedUsers);
        if (isUserBannedSync(uid, email)) return true;
      }
    }
  } catch {
    // ignore
  }

  if (uid) {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.isBanned === true || String(uData.status || '').toLowerCase() === 'banned') {
          const current = getLocalBannedUsers();
          if (!current.some((b) => b.sellerId === uid)) {
            saveLocalBannedUsers([
              ...current,
              {
                sellerId: uid,
                sellerEmail: email || uData.email || '',
                sellerName: uData.name || uData.displayName || '',
                bannedAt: new Date().toISOString(),
              },
            ]);
          }
          return true;
        }
      }
    } catch {
      // ignore
    }
  }

  return false;
}

export async function submitListingReport(
  payload: Omit<ListingReport, 'id' | 'createdAt' | 'status'>
): Promise<ListingReport> {
  const newReport: ListingReport = {
    ...payload,
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  // 1. Save immediately in local storage so UI & Admin are always in sync
  const local = getLocalReports();
  const updated = [newReport, ...local];
  saveLocalReports(updated);

  // 2. Also attempt to save to Firestore `reports` collection
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...newReport,
    });
    newReport.id = docRef.id;
    saveLocalReports([newReport, ...local]);
  } catch {
    // If Firestore security rules restrict unauthenticated report creation, local + settings sync handles it
  }

  return newReport;
}

export async function fetchAllReports(): Promise<ListingReport[]> {
  const localReports = getLocalReports();
  const map = new Map<string, ListingReport>();

  localReports.forEach((r) => map.set(r.id, r));

  try {
    const snap = await getDocs(collection(db, 'reports'));
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      const item: ListingReport = {
        id: d.id,
        productId: data.productId || '',
        productTitle: data.productTitle || 'Listing',
        productImage: data.productImage || '',
        sellerId: data.sellerId || '',
        sellerName: data.sellerName || 'Seller',
        sellerEmail: data.sellerEmail || '',
        reason: data.reason || 'other',
        reasonLabelAr: data.reasonLabelAr || 'سبب آخر',
        reasonLabelEn: data.reasonLabelEn || 'Other',
        notes: data.notes || '',
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'pending',
        reporterId: data.reporterId || '',
        reporterEmail: data.reporterEmail || '',
      };
      map.set(item.id, item);
    });
  } catch {
    // fallback to localReports
  }

  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'moderation_reports'));
    if (settingsSnap.exists() && Array.isArray(settingsSnap.data().items)) {
      settingsSnap.data().items.forEach((item: ListingReport) => {
        if (item && item.id) {
          map.set(item.id, item);
        }
      });
    }
  } catch {
    // ignore
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  saveLocalReports(merged);
  return merged;
}

async function persistReportsToSettings(reports: ListingReport[]) {
  saveLocalReports(reports);
  try {
    await setDoc(doc(db, 'settings', 'moderation_reports'), { items: reports }, { merge: true });
  } catch {
    // ignore
  }
}

export async function dismissReportAction(reportId: string): Promise<ListingReport[]> {
  const current = await fetchAllReports();
  const updated = current.map((r) =>
    r.id === reportId ? { ...r, status: 'dismissed' as const } : r
  );
  await persistReportsToSettings(updated);

  try {
    await updateDoc(doc(db, 'reports', reportId), { status: 'dismissed' });
  } catch {
    // ignore if local-only report id
  }

  return updated;
}

export async function deleteReportedProductAction(report: ListingReport): Promise<ListingReport[]> {
  if (report.productId) {
    addLocalDeletedProductIds([report.productId]);
    try {
      await deleteDoc(doc(db, 'products', report.productId));
    } catch {
      // ignore if already deleted or rule restricted
    }
  }

  const current = await fetchAllReports();
  const updated = current.map((r) =>
    r.id === report.id || (report.productId && r.productId === report.productId)
      ? { ...r, status: 'resolved_deleted' as const }
      : r
  );
  await persistReportsToSettings(updated);

  try {
    await updateDoc(doc(db, 'reports', report.id), { status: 'resolved_deleted' });
  } catch {
    // ignore
  }

  return updated;
}

export async function banSellerAndRemoveAdsAction(report: ListingReport): Promise<ListingReport[]> {
  const sellerId = report.sellerId || `seller_${report.sellerName || Date.now()}`;
  const currentBans = getLocalBannedUsers();
  const exists = currentBans.some(
    (b) =>
      (b.sellerId && b.sellerId === sellerId) ||
      (report.sellerEmail && b.sellerEmail === report.sellerEmail)
  );

  const newBan: BannedSellerRecord = {
    sellerId,
    sellerName: report.sellerName,
    sellerEmail: report.sellerEmail,
    bannedAt: new Date().toISOString(),
    reason: report.reasonLabelAr || report.reasonLabelEn,
  };

  const nextBans = exists ? currentBans : [newBan, ...currentBans];
  saveLocalBannedUsers(nextBans);

  // Sync ban to settings/moderation_bans and users/{sellerId}
  try {
    await setDoc(doc(db, 'settings', 'moderation_bans'), { bannedUsers: nextBans }, { merge: true });
  } catch {
    // ignore
  }

  if (report.sellerId) {
    try {
      await updateDoc(doc(db, 'users', report.sellerId), {
        isBanned: true,
        status: 'Banned',
      });
    } catch {
      // ignore
    }
  }

  // Delete all products belonging to this seller from Firestore & mark deleted locally
  const deletedIds: string[] = report.productId ? [report.productId] : [];
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    const deletePromises: Promise<any>[] = [];
    prodSnap.docs.forEach((d) => {
      const pData = d.data();
      const matchId = report.sellerId && pData.sellerId === report.sellerId;
      const matchName =
        report.sellerName &&
        pData.sellerName &&
        String(pData.sellerName).trim().toLowerCase() === report.sellerName.trim().toLowerCase();
      const matchProduct = report.productId && d.id === report.productId;

      if (matchId || matchName || matchProduct) {
        deletedIds.push(d.id);
        deletePromises.push(deleteDoc(doc(db, 'products', d.id)).catch(() => {}));
      }
    });
    await Promise.all(deletePromises);
  } catch {
    // ignore
  }

  addLocalDeletedProductIds(deletedIds);

  // Update report status
  const current = await fetchAllReports();
  const updated = current.map((r) =>
    r.id === report.id ||
    (report.sellerId && r.sellerId === report.sellerId) ||
    (report.productId && r.productId === report.productId)
      ? { ...r, status: 'resolved_banned' as const }
      : r
  );
  await persistReportsToSettings(updated);

  try {
    await updateDoc(doc(db, 'reports', report.id), { status: 'resolved_banned' });
  } catch {
    // ignore
  }

  return updated;
}

export async function unbanSellerAction(sellerId: string): Promise<BannedSellerRecord[]> {
  const currentBans = getLocalBannedUsers();
  const nextBans = currentBans.filter((b) => b.sellerId !== sellerId);
  saveLocalBannedUsers(nextBans);

  try {
    await setDoc(doc(db, 'settings', 'moderation_bans'), { bannedUsers: nextBans }, { merge: true });
  } catch {
    // ignore
  }

  try {
    await updateDoc(doc(db, 'users', sellerId), {
      isBanned: false,
      status: 'Active',
    });
  } catch {
    // ignore
  }

  return nextBans;
}
