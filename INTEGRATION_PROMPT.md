# CashierMu — Frontend Integration Prompt

Paste prompt ini ke sesi Claude Code baru yang dibuka di folder frontend (`cashiermu`).
Prompt ini berisi semua instruksi yang dibutuhkan untuk menghubungkan backend API ke UI React Native yang sudah ada.

---

## Context

Kamu sedang mengintegrasikan backend API ke project React Native / Expo bernama **CashierMu**.

- **Frontend project:** `/Users/dikomahendra/Documents/PERSONAL-PROJECTS/cashiermu`
- **Backend project:** `/Users/dikomahendra/Documents/PERSONAL-PROJECTS/server-cashiermu`
- **Backend URL:** `http://localhost:3000/api/v1`
- **Backend stack:** Node.js / Express / TypeScript / Prisma / PostgreSQL

**Goal:** Ganti semua dummy data dan logika lokal di `src/stores/useAppStore.ts` dengan API call nyata ke backend. Jangan ubah file screen kecuali disebutkan secara eksplisit.

**Yang sudah ada:**
- Seluruh UI (screens, components) — sudah selesai
- Zustand store (`src/stores/useAppStore.ts`) dengan semua dummy data dan actions
- TypeScript types di `src/types/index.ts`
- Navigation di `src/navigation/`

---

## Step 1: Install Dependencies

Jalankan dari root project frontend:

```bash
npx expo install expo-secure-store
npm install axios
```

---

## Step 2: Buat Token Storage Utility

Buat file baru `src/services/tokenStorage.ts`:

```typescript
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'cashiermu_access_token';
const REFRESH_TOKEN_KEY = 'cashiermu_refresh_token';

export const tokenStorage = {
  saveTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
```

---

## Step 3: Buat API Client

Buat file baru `src/services/api.ts`:

```typescript
import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// Ganti dengan IP Mac kamu saat test di device fisik
// Contoh: 'http://192.168.1.100:3000/api/v1'
// Biarkan localhost untuk emulator/simulator
const BASE_URL = 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach token ke setiap request
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token saat dapat 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data;

        await tokenStorage.saveTokens(accessToken, refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await tokenStorage.clearTokens();
        // Token kadaluarsa — user harus login ulang
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Step 4: Buat Service Files

Buat semua file berikut di folder `src/services/`:

### `src/services/auth.service.ts`

```typescript
import { api } from './api';
import { tokenStorage } from './tokenStorage';

export const authService = {
  login: async (credential: string, pin: string) => {
    const res = await api.post('/auth/login', { credential, pin });
    const { accessToken, refreshToken, user } = res.data;
    await tokenStorage.saveTokens(accessToken, refreshToken);
    return { user, accessToken, refreshToken };
  },

  register: async (data: {
    storeName: string;
    ownerName: string;
    email: string;
    phone: string;
    pin: string;
    pinConfirm: string;
  }) => {
    const res = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user, store } = res.data;
    await tokenStorage.saveTokens(accessToken, refreshToken);
    return { user, store, accessToken, refreshToken };
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
    await tokenStorage.clearTokens();
  },

  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
```

### `src/services/store.service.ts`

```typescript
import { api } from './api';

export const storeService = {
  getStore: async () => {
    const res = await api.get('/store');
    return res.data;
  },

  updateStore: async (data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    serviceChargeEnabled?: boolean;
    serviceChargeRate?: number;
    currency?: string;
    currencySymbol?: string;
  }) => {
    const res = await api.put('/store', data);
    return res.data;
  },
};
```

### `src/services/users.service.ts`

```typescript
import { api } from './api';

export const usersService = {
  listUsers: async (role?: 'owner' | 'cashier') => {
    const res = await api.get('/users', { params: role ? { role } : undefined });
    return res.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    phone: string;
    role: 'owner' | 'cashier';
    pin: string;
    branchId: string;
  }) => {
    const res = await api.post('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    branchId?: string;
  }) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  toggleActive: async (id: string) => {
    const res = await api.patch(`/users/${id}/toggle-active`);
    return res.data;
  },

  changePin: async (userId: string, newPin: string, ownerPin: string) => {
    const res = await api.patch(`/users/${userId}/change-pin`, { newPin, ownerPin });
    return res.data;
  },
};
```

### `src/services/branches.service.ts`

```typescript
import { api } from './api';

export const branchesService = {
  listBranches: async () => {
    const res = await api.get('/branches');
    return res.data;
  },
};
```

### `src/services/categories.service.ts`

```typescript
import { api } from './api';

export const categoriesService = {
  listCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
};
```

### `src/services/products.service.ts`

```typescript
import { api } from './api';

export const productsService = {
  listProducts: async (params?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const res = await api.get('/products', { params });
    // Map imageUrl → image agar sesuai dengan frontend Product type
    return res.data.map((p: any) => ({ ...p, image: p.imageUrl ?? null }));
  },

  createProduct: async (data: {
    name: string;
    sku?: string;
    barcode?: string;
    categoryId: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    minStock?: number;
    imageUrl?: string;
    isFeatured?: boolean;
    taxable?: boolean;
    unit?: string;
    variantGroups?: any[];
  }) => {
    const body = { ...data, variantGroups: data.variantGroups ?? [] };
    const res = await api.post('/products', body);
    return { ...res.data, image: res.data.imageUrl ?? null };
  },

  updateProduct: async (id: string, data: {
    name?: string;
    categoryId?: string;
    buyPrice?: number;
    sellPrice?: number;
    stock?: number;
    minStock?: number;
    imageUrl?: string;
    isFeatured?: boolean;
    isActive?: boolean;
    taxable?: boolean;
    unit?: string;
  }) => {
    const res = await api.put(`/products/${id}`, data);
    return { ...res.data, image: res.data.imageUrl ?? null };
  },

  deleteProduct: async (id: string) => {
    await api.delete(`/products/${id}`);
  },

  adjustStock: async (id: string, adjustment: number) => {
    const res = await api.patch(`/products/${id}/stock`, { adjustment });
    return res.data;
  },
};
```

### `src/services/shifts.service.ts`

```typescript
import { api } from './api';

export const shiftsService = {
  openShift: async (data: {
    type: string;
    openingBalance: number;
    branchId: string;
  }) => {
    const res = await api.post('/shifts/open', data);
    return res.data;
  },

  closeShift: async (data: { closingBalance: number; notes?: string }) => {
    const res = await api.post('/shifts/close', data);
    return res.data;
  },

  getCurrentShift: async () => {
    try {
      const res = await api.get('/shifts/current');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },
};
```

### `src/services/transactions.service.ts`

```typescript
import { api } from './api';

export const transactionsService = {
  createTransaction: async (data: {
    shiftId: string;
    branchId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      note?: string;
      selectedVariants?: any[];
    }>;
    payments: Array<{ method: string; amount: number; reference?: string }>;
    discount?: { type: 'percent' | 'fixed'; value: number; label?: string; code?: string };
    cashPaid?: number;
    customerName?: string;
    note?: string;
  }) => {
    const res = await api.post('/transactions', data);
    return res.data;
  },

  listTransactions: async (params?: {
    shiftId?: string;
    branchId?: string;
    status?: 'paid' | 'voided' | 'pending';
    from?: string;
    to?: string;
    search?: string;
  }) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },

  getTransaction: async (id: string) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },

  voidTransaction: async (id: string, ownerPin: string, reason: string) => {
    const res = await api.post(`/transactions/${id}/void`, { ownerPin, reason });
    return res.data;
  },
};
```

### `src/services/reports.service.ts`

```typescript
import { api } from './api';

export const reportsService = {
  getSummary: async (params?: { from?: string; to?: string; branchId?: string }) => {
    const res = await api.get('/reports/summary', { params });
    return res.data; // { totalRevenue, transactionCount, avgOrderValue }
  },

  getChart: async (params?: { period?: 'day' | 'week' | 'month' | 'year'; offset?: number }) => {
    const res = await api.get('/reports/chart', { params });
    return res.data;
    // { period, label, points: [{label, date, revenue, count}], totalRevenue, totalCount }
  },

  getTopProducts: async (params?: { from?: string; to?: string; limit?: number }) => {
    const res = await api.get('/reports/top-products', { params });
    return res.data;
    // [{ productId, productName, sku, totalQuantity, totalRevenue }]
  },

  getPaymentBreakdown: async (params?: { from?: string; to?: string }) => {
    const res = await api.get('/reports/payment-breakdown', { params });
    return res.data; // [{ method, total, count }]
  },
};
```

### `src/services/pendingBills.service.ts`

```typescript
import { api } from './api';

export const pendingBillsService = {
  list: async () => {
    const res = await api.get('/pending-bills');
    return res.data;
  },

  create: async (data: {
    label: string;
    items: any[];
    subtotal: number;
    note?: string;
  }) => {
    const res = await api.post('/pending-bills', data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/pending-bills/${id}`);
  },
};
```

---

## Step 5: Refactor `src/stores/useAppStore.ts`

**PENTING:** Jangan rewrite seluruh file. Lakukan perubahan bertarget pada setiap action secara terpisah agar screen yang sudah ada tidak perlu diubah.

### 5a. Tambahkan imports di atas useAppStore.ts

Tambahkan import berikut setelah import yang sudah ada:

```typescript
import { authService } from '../services/auth.service';
import { storeService } from '../services/store.service';
import { usersService } from '../services/users.service';
import { branchesService } from '../services/branches.service';
import { categoriesService } from '../services/categories.service';
import { productsService } from '../services/products.service';
import { shiftsService } from '../services/shifts.service';
import { transactionsService } from '../services/transactions.service';
import { reportsService } from '../services/reports.service';
import { pendingBillsService } from '../services/pendingBills.service';
import { tokenStorage } from '../services/tokenStorage';
```

### 5b. Ganti initial state dari dummy data ke array kosong

Temukan di mana `DUMMY_USERS`, `DUMMY_PRODUCTS`, dll. di-assign ke state. Ganti dengan array kosong:

```typescript
// SEBELUM:
users: DUMMY_USERS,
products: DUMMY_PRODUCTS,
categories: DUMMY_CATEGORIES,
branches: DUMMY_BRANCHES,
transactions: DUMMY_TRANSACTIONS,

// SESUDAH:
users: [],
products: [],
categories: [],
branches: [],
transactions: [],
```

### 5c. Ganti action `login`

Temukan action `login` yang saat ini melakukan pengecekan PIN secara lokal terhadap `state.users`. Ganti dengan:

```typescript
login: async (credential: string, pin: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { user } = await authService.login(credential, pin);
    const mappedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role,
      pin: '',              // PIN tidak pernah dikembalikan oleh API
      branchId: user.branchId,
      avatar: user.avatarUrl ?? null,   // avatarUrl → avatar
      isActive: user.isActive,
      emailVerified: false,             // tidak ada di API, default false
      createdAt: user.createdAt ?? new Date().toISOString(),
    };
    set({ currentUser: mappedUser });
    return { success: true };
  } catch (err: any) {
    const message = err.response?.data?.message ?? 'Login gagal. Coba lagi.';
    return { success: false, error: message };
  }
},
```

### 5d. Ganti action `register`

Temukan action `register` yang saat ini menyimpan user secara lokal. Ganti dengan:

```typescript
register: async (data: {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  pin: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    // API butuh pinConfirm — dikirim sama dengan pin
    await authService.register({ ...data, pinConfirm: data.pin });
    return { success: true };
  } catch (err: any) {
    const message = err.response?.data?.message ?? 'Pendaftaran gagal. Coba lagi.';
    return { success: false, error: message };
  }
},
```

### 5e. Ganti action `logout`

```typescript
logout: async () => {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) await authService.logout(refreshToken);
  } catch {
    // abaikan error logout
  } finally {
    set({ currentUser: null, currentShift: null });
  }
},
```

### 5f. Tambahkan action `loadInitialData` (baru)

Tambahkan action baru ini ke dalam store. Akan dipanggil saat app pertama kali buka setelah token tersedia:

```typescript
loadInitialData: async () => {
  try {
    const [storeData, users, branches, categories, products, shift] = await Promise.all([
      storeService.getStore(),
      usersService.listUsers(),
      branchesService.listBranches(),
      categoriesService.listCategories(),
      productsService.listProducts({ isActive: true }),
      shiftsService.getCurrentShift(),
    ]);

    const mappedProfile: StoreProfile = {
      id: storeData.id,
      name: storeData.name,
      address: storeData.address ?? '',
      phone: storeData.phone ?? '',
      email: storeData.email ?? '',
      logoUri: storeData.logoUrl ?? null,  // logoUrl → logoUri
      taxEnabled: storeData.taxEnabled,
      taxRate: Number(storeData.taxRate),
      serviceChargeEnabled: storeData.serviceChargeEnabled,
      serviceChargeRate: Number(storeData.serviceChargeRate),
      currency: storeData.currency ?? 'IDR',
      currencySymbol: storeData.currencySymbol ?? 'Rp',
    };

    const mappedUsers: User[] = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email ?? '',
      phone: u.phone ?? '',
      role: u.role,
      pin: '',
      branchId: u.branchId,
      avatar: u.avatarUrl ?? null,
      isActive: u.isActive,
      emailVerified: false,
      createdAt: u.createdAt ?? '',
    }));

    set({
      storeProfile: mappedProfile,
      users: mappedUsers,
      branches,
      categories,
      products,
      currentShift: shift,
    });
  } catch (err) {
    console.error('Failed to load initial data:', err);
  }
},
```

### 5g. Ganti action `openShift`

```typescript
openShift: async (data: {
  type: ShiftType;
  openingBalance: number;
  branchId: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const shift = await shiftsService.openShift(data);
    set({ currentShift: shift });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal membuka shift.' };
  }
},
```

### 5h. Ganti action `closeShift`

```typescript
closeShift: async (data: {
  closingBalance: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    await shiftsService.closeShift(data);
    set({ currentShift: null });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal menutup shift.' };
  }
},
```

### 5i. Ganti action `checkout`

Action checkout saat ini menghitung total secara lokal dan menyimpan ke `state.transactions`. Ganti dengan:

```typescript
checkout: async (
  cartItems: CartItem[],
  payments: PaymentEntry[],
  discount?: Discount,
  customerName?: string,
  note?: string,
): Promise<{ success: boolean; transaction?: Transaction; error?: string }> => {
  const { currentShift } = get();
  if (!currentShift) return { success: false, error: 'Tidak ada shift aktif.' };

  try {
    const items = cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      note: item.note,
      selectedVariants: item.selectedVariants,
    }));

    const paymentsPayload = payments.map((p) => ({
      method: p.method,
      amount: p.amount,
      reference: p.reference,
    }));

    const cashPaid = payments
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + p.amount, 0);

    const transaction = await transactionsService.createTransaction({
      shiftId: currentShift.id,
      branchId: currentShift.branchId,
      items,
      payments: paymentsPayload,
      discount: discount
        ? { type: discount.type, value: discount.value, label: discount.label, code: discount.code }
        : undefined,
      cashPaid,
      customerName,
      note,
    });

    // Refresh produk untuk update stok
    const updatedProducts = await productsService.listProducts({ isActive: true });
    set((state) => ({
      products: updatedProducts,
      transactions: [transaction, ...state.transactions],
    }));

    return { success: true, transaction };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Checkout gagal.' };
  }
},
```

### 5j. Ganti action `voidTransaction`

```typescript
voidTransaction: async (
  id: string,
  ownerPin: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    await transactionsService.voidTransaction(id, ownerPin, reason);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, status: 'voided' as const } : t
      ),
    }));
    // Refresh produk untuk restore stok
    const updatedProducts = await productsService.listProducts({ isActive: true });
    set({ products: updatedProducts });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Void gagal.' };
  }
},
```

### 5k. Ganti actions produk CRUD

```typescript
addProduct: async (
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const product = await productsService.createProduct({
      ...data,
      imageUrl: data.image ?? undefined,
    });
    set((state) => ({ products: [...state.products, product] }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal menambah produk.' };
  }
},

updateProduct: async (
  id: string,
  data: Partial<Product>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updated = await productsService.updateProduct(id, {
      ...data,
      imageUrl: data.image ?? undefined,
    });
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal mengupdate produk.' };
  }
},

deleteProduct: async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await productsService.deleteProduct(id);
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal menghapus produk.' };
  }
},
```

### 5l. Ganti actions karyawan (users) CRUD

```typescript
addEmployee: async (data: {
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'cashier';
  pin: string;
  branchId: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = await usersService.createUser(data);
    const mappedUser: User = {
      ...user,
      pin: '',
      avatar: user.avatarUrl ?? null,
      emailVerified: false,
      createdAt: user.createdAt ?? new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, mappedUser] }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal menambah karyawan.' };
  }
},

updateEmployee: async (
  id: string,
  data: Partial<User>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updated = await usersService.updateUser(id, data);
    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, ...updated, avatar: updated.avatarUrl ?? u.avatar } : u
      ),
    }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal mengupdate karyawan.' };
  }
},
```

### 5m. Ganti action `updateStoreProfile`

```typescript
updateStoreProfile: async (
  data: Partial<StoreProfile>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // logoUri (frontend) → logoUrl (backend)
    const { logoUri, ...rest } = data as any;
    const payload = { ...rest, ...(logoUri !== undefined ? { logoUrl: logoUri } : {}) };
    const updated = await storeService.updateStore(payload);
    set((state) => ({
      storeProfile: {
        ...state.storeProfile,
        ...updated,
        logoUri: updated.logoUrl ?? state.storeProfile.logoUri,
      },
    }));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message ?? 'Gagal mengupdate profil toko.' };
  }
},
```

---

## Step 6: Update RootNavigator untuk App Bootstrap

Di `src/navigation/RootNavigator.tsx`, tambahkan logic startup yang:
1. Cek apakah access token tersedia
2. Jika ada token, panggil `loadInitialData` dan arahkan ke Main
3. Jika tidak ada token, arahkan ke Login

```typescript
import { useEffect, useState } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { useAppStore } from '../stores/useAppStore';

// Di dalam component Navigator:
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const bootstrap = async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        await useAppStore.getState().loadInitialData();
        // navigate to Main tabs
      } else {
        // navigate to Login
      }
    } catch {
      // Token invalid, arahkan ke Login
      await tokenStorage.clearTokens();
      // navigate to Login
    } finally {
      setIsLoading(false);
    }
  };
  bootstrap();
}, []);
```

---

## Step 7: Update HistoryScreen untuk Fetch Transaksi

Di `src/screens/History/HistoryScreen.tsx`, tambahkan fetch real transactions:

```typescript
import { useEffect } from 'react';
import { transactionsService } from '../../services/transactions.service';
import { useAppStore } from '../../stores/useAppStore';

// Di dalam component:
useEffect(() => {
  const fetchTransactions = async () => {
    try {
      const txns = await transactionsService.listTransactions();
      useAppStore.setState({ transactions: txns });
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };
  fetchTransactions();
}, []);
```

---

## Step 8: Update ReportsScreen untuk Fetch Data Laporan

Di `src/screens/Reports/ReportsScreen.tsx`, ganti data dummy dengan:

```typescript
import { useEffect, useState } from 'react';
import { reportsService } from '../../services/reports.service';

// Di dalam component:
const [summary, setSummary] = useState<any>(null);
const [chartData, setChartData] = useState<any>(null);
const [topProducts, setTopProducts] = useState<any[]>([]);

useEffect(() => {
  const fetchReports = async () => {
    try {
      const [sum, chart, top] = await Promise.all([
        reportsService.getSummary(),
        reportsService.getChart({ period: 'week' }),
        reportsService.getTopProducts({ limit: 5 }),
      ]);
      setSummary(sum);
      setChartData(chart);
      setTopProducts(top);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };
  fetchReports();
}, []);
```

---

## Field Name Mapping (Perbedaan Nama Field)

| Field di Frontend (types/index.ts) | Field di Backend API | Cara handle |
|---|---|---|
| `Product.image` | `imageUrl` | Map di productsService: `{ ...p, image: p.imageUrl ?? null }` |
| `StoreProfile.logoUri` | `logoUrl` | Map di `loadInitialData` & `updateStoreProfile` |
| `User.avatar` | `avatarUrl` | Map di semua action yang mengembalikan user |
| `User.pin` | Tidak dikembalikan API | Set ke `''` (string kosong) |
| `User.emailVerified` | Tidak ada di API | Set ke `false` |

---

## Catatan Penting LoginScreen

`LoginScreen.tsx` saat ini:
- Membaca `state.users` untuk menampilkan daftar akun
- Memanggil `login(selectedUser.email, pinValue)`

Setelah integrasi:
- `state.users` akan diisi dari API via `loadInitialData` (sudah ada users nyata)
- Signature `login(email, pin)` sudah cocok dengan API (field `credential` menerima email)
- **Tidak perlu ubah LoginScreen sama sekali**

---

## Catatan Penting RegisterScreen

`RegisterScreen.tsx` memanggil:
```typescript
register({ storeName, ownerName, email, phone, pin })
```

Action `register` baru (Step 5d) akan otomatis menambahkan `pinConfirm: data.pin` sebelum kirim ke API.
**Tidak perlu ubah RegisterScreen sama sekali.**

---

## Base URL untuk Device Fisik

Saat testing di smartphone (bukan emulator), ubah BASE_URL di `src/services/api.ts`:

```typescript
// Cek IP Mac kamu: System Settings → Wi-Fi → Details → IP Address
// Pastikan HP dan Mac terhubung ke Wi-Fi yang SAMA
const BASE_URL = 'http://192.168.1.XXX:3000/api/v1'; // ganti XXX dengan IP Mac
```

| Environment | URL |
|---|---|
| iOS Simulator | `http://localhost:3000/api/v1` |
| Android Emulator | `http://10.0.2.2:3000/api/v1` |
| Device fisik | `http://IP_MAC:3000/api/v1` |

---

## Urutan Pengerjaan (Lakukan Berurutan)

1. Install dependencies (Step 1)
2. Buat `tokenStorage.ts` dan `api.ts` (Step 2-3)
3. Buat semua service files (Step 4)
4. Update `useAppStore.ts`: tambah imports (5a), kosongkan initial state (5b)
5. Ganti `login`, `register`, `logout` (5c-5e)
6. Tambahkan `loadInitialData` (5f)
7. Update `RootNavigator.tsx` untuk call `loadInitialData` saat app start (Step 6)
8. Test: buka app → seharusnya bisa login dengan data dari database
9. Ganti sisa actions satu per satu: openShift, closeShift, checkout, voidTransaction, products CRUD, employees CRUD, updateStoreProfile (5g-5m)
10. Tambahkan fetch di HistoryScreen dan ReportsScreen (Step 7-8)

---

## API Quick Reference

Semua endpoint ada di `http://localhost:3000/api/v1/`. Endpoint bertanda **(auth)** butuh header `Authorization: Bearer <accessToken>`.

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| POST | /auth/register | No | Buat akun store + owner |
| POST | /auth/login | No | Login dengan email/HP + PIN |
| POST | /auth/refresh | No | Refresh access token |
| POST | /auth/logout | Yes | Hapus refresh token |
| GET | /auth/me | Yes | Profil user saat ini |
| GET | /store | Yes | Ambil profil toko |
| PUT | /store | Yes (owner) | Update profil toko |
| GET | /branches | Yes | Daftar cabang |
| GET | /categories | Yes | Daftar kategori |
| GET | /products | Yes | Daftar produk |
| POST | /products | Yes (owner) | Buat produk baru |
| PUT | /products/:id | Yes (owner) | Update produk |
| DELETE | /products/:id | Yes (owner) | Hapus produk (soft delete) |
| PATCH | /products/:id/stock | Yes (owner) | Sesuaikan stok |
| GET | /users | Yes | Daftar user/karyawan |
| POST | /users | Yes (owner) | Buat karyawan baru |
| PUT | /users/:id | Yes (owner) | Update karyawan |
| PATCH | /users/:id/toggle-active | Yes (owner) | Aktif/nonaktifkan karyawan |
| PATCH | /users/:id/change-pin | Yes (owner) | Ganti PIN karyawan |
| POST | /shifts/open | Yes | Buka shift |
| POST | /shifts/close | Yes | Tutup shift aktif |
| GET | /shifts/current | Yes | Shift aktif saat ini |
| POST | /transactions | Yes | Buat transaksi baru |
| GET | /transactions | Yes | Daftar transaksi |
| GET | /transactions/:id | Yes | Detail transaksi |
| POST | /transactions/:id/void | Yes | Void transaksi (butuh PIN owner) |
| GET | /reports/summary | Yes | Ringkasan omzet |
| GET | /reports/chart | Yes | Data grafik (period: day/week/month/year) |
| GET | /reports/top-products | Yes | Produk terlaris |
| GET | /reports/payment-breakdown | Yes | Breakdown metode pembayaran |
| GET | /pending-bills | Yes | Daftar tagihan tertunda |
| POST | /pending-bills | Yes | Simpan tagihan tertunda |
| DELETE | /pending-bills/:id | Yes | Hapus tagihan tertunda |

---

## Pastikan Backend Berjalan

Sebelum mulai, pastikan backend berjalan:

```bash
cd /Users/dikomahendra/Documents/PERSONAL-PROJECTS/server-cashiermu
npm run dev
# Harus muncul: info: CashierMu API running on port 3000
```

Test endpoint:
```bash
curl http://localhost:3000/health
# Output: {"status":"ok","timestamp":"..."}

curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"credential":"budi@cashiermu.com","pin":"123456"}'
```
