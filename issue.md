# Feature: User Registration API

## Overview

Implementasikan fitur registrasi user baru di project backend ini. Project menggunakan **Bun** sebagai runtime, **ElysiaJS** sebagai framework HTTP, **Drizzle ORM** untuk akses database, dan **MySQL** sebagai database.

Tugas kamu adalah membuat endpoint `POST /api/users` yang menerima data registrasi, memvalidasi keunikan email, meng-hash password menggunakan bcrypt, lalu menyimpan data user ke database.

---

## Tech Stack Project

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Bun | >= 1.3 | JavaScript runtime (pengganti Node.js) |
| ElysiaJS | >= 1.4 | HTTP framework |
| Drizzle ORM | >= 0.45 | ORM untuk akses database |
| MySQL | >= 8.0 | Database |
| bcryptjs | >= 3.0 | Hashing password |

---

## Struktur Project Saat Ini

```
belajar-vibe-code/
├── src/
│   ├── db/
│   │   ├── config.ts       ← koneksi database Drizzle ORM (SUDAH ADA, JANGAN DIUBAH)
│   │   └── schema.ts       ← definisi tabel MySQL (SUDAH ADA, UPDATE diperlukan)
│   ├── routes/
│   │   └── user-route.ts   ← routing ElysiaJS (BUAT BARU)
│   ├── services/
│   │   └── user-service.ts ← business logic (BUAT BARU)
│   └── index.ts            ← entry point server (UPDATE diperlukan)
├── drizzle.config.ts       ← konfigurasi Drizzle Kit untuk migrasi
├── .env                    ← konfigurasi environment variables database
└── package.json
```

---

## Spesifikasi API

### Endpoint

```
POST /api/users
Content-Type: application/json
```

### Request Body

```json
{
  "name": "Eko",
  "email": "eko@localhost",
  "password": "rahasia"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| name | string | Ya | Nama user |
| email | string | Ya | Email user, harus unik |
| password | string | Ya | Password plain text, akan di-hash oleh server |

### Response Sukses

HTTP Status: `200 OK`

```json
{
  "data": "OK"
}
```

### Response Error — Email Sudah Terdaftar

HTTP Status: `200 OK`

```json
{
  "error": "Email sudah terdaftar"
}
```

---

## Struktur Tabel Database

Tabel `users` di MySQL harus memiliki kolom berikut:

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID unik user |
| name | VARCHAR(255) | NOT NULL | Nama user |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email user |
| password | VARCHAR(255) | NOT NULL | Password yang sudah di-hash bcrypt |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu registrasi |

---

## Tahapan Implementasi

### Tahap 1 — Pastikan Dependency Sudah Terinstall

Buka terminal di folder project dan jalankan:

```bash
bun add bcryptjs
bun add -d @types/bcryptjs
```

Verifikasi bahwa `bcryptjs` sudah muncul di `package.json` pada bagian `dependencies`.

---

### Tahap 2 — Update Schema Database (`src/db/schema.ts`)

Buka file `src/db/schema.ts`. File ini mendefinisikan struktur tabel di database menggunakan Drizzle ORM.

**Kondisi file saat ini:**
- Sudah ada kolom: `id`, `name`, `email`, `createdAt`, `updatedAt`
- Kolom `password` belum ada
- Kolom `updatedAt` tidak diperlukan

**Yang harus diubah:**
1. Hapus import `datetime` dari `drizzle-orm/mysql-core`
2. Tambah import `timestamp` dari `drizzle-orm/mysql-core`
3. Hapus import `sql` dari `drizzle-orm` (tidak dibutuhkan lagi)
4. Tambah kolom `password: varchar({ length: 255 }).notNull()`
5. Ubah `createdAt` dari tipe `datetime` ke tipe `timestamp().notNull().defaultNow()`
6. Hapus kolom `updatedAt`

**Hasil akhir file `src/db/schema.ts` yang benar:**

```typescript
import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
```

---

### Tahap 3 — Jalankan Migrasi Database

Setelah schema diupdate, sinkronkan perubahan ke database MySQL dengan menjalankan:

```bash
bun run drizzle-kit push
```

> **Catatan**: Pastikan MySQL sudah berjalan dan konfigurasi di file `.env` sudah benar sebelum menjalankan perintah ini. File `.env` berada di root folder project.

Verifikasi bahwa tabel `users` di database sudah memiliki kolom `password`.

---

### Tahap 4 — Buat File User Service (`src/services/user-service.ts`)

Buat folder `src/services/` jika belum ada, lalu buat file `user-service.ts` di dalamnya.

File ini berisi **business logic** untuk registrasi user. Business logic dipisahkan dari routing agar kode lebih mudah di-maintain dan di-test.

**Logic yang harus diimplementasikan dalam fungsi `registerUser`:**

1. Query ke database untuk mencari apakah email sudah terdaftar menggunakan `db.select()` dengan filter `eq(users.email, email)`
2. Jika hasil query tidak kosong (email sudah ada), **lempar error** dengan pesan `"Email sudah terdaftar"`
3. Jika email belum ada, hash password menggunakan `bcrypt.hash(password, 10)` — angka `10` adalah salt rounds (semakin besar semakin aman tapi semakin lambat)
4. Insert data user baru ke database menggunakan `db.insert(users).values({ name, email, password: hashedPassword })`
5. Return string `"OK"` jika insert berhasil

**Isi file `src/services/user-service.ts` yang benar:**

```typescript
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/config";
import { users } from "../db/schema";

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existing.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({ name, email, password: hashedPassword });

  return "OK";
}
```

**Penjelasan penting:**
- `eq` dari `drizzle-orm` digunakan sebagai kondisi filter `WHERE email = ?`
- `bcrypt.hash(password, 10)` menghasilkan string hash yang tidak bisa di-decode balik
- Password yang disimpan ke database adalah hash-nya, **bukan** plain text

---

### Tahap 5 — Buat File User Route (`src/routes/user-route.ts`)

Buat folder `src/routes/` jika belum ada, lalu buat file `user-route.ts` di dalamnya.

File ini mendefinisikan **endpoint HTTP** menggunakan ElysiaJS. Route hanya bertugas menerima request, meneruskan ke service, dan mengembalikan response — **tidak boleh ada business logic di sini**.

**Yang harus diimplementasikan:**
1. Definisikan route `POST /api/users`
2. Ambil `name`, `email`, dan `password` dari `body` request
3. Panggil fungsi `registerUser` dari service dalam blok `try-catch`
4. Jika berhasil, return `{ data: "OK" }`
5. Jika terjadi error, return `{ error: error.message }`
6. Export instance Elysia sebagai named export `userRoute`

**Isi file `src/routes/user-route.ts` yang benar:**

```typescript
import { Elysia } from "elysia";
import { registerUser } from "../services/user-service";

export const userRoute = new Elysia().post("/api/users", async ({ body }) => {
  const { name, email, password } = body as {
    name: string;
    email: string;
    password: string;
  };

  try {
    const result = await registerUser(name, email, password);
    return { data: result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});
```

**Penjelasan penting:**
- `body as { name: string; email: string; password: string }` adalah type casting karena ElysiaJS belum tahu bentuk body secara otomatis di sini
- `error instanceof Error` digunakan agar TypeScript tidak complain saat mengakses `.message`

---

### Tahap 6 — Daftarkan Route ke Server (`src/index.ts`)

Buka file `src/index.ts`. File ini adalah entry point server ElysiaJS.

**Yang harus diubah:**
1. Tambah import `userRoute` dari `./routes/user-route`
2. Tambah `.use(userRoute)` pada instance Elysia **sebelum** route lain didefinisikan

**Contoh perubahan pada `src/index.ts`:**

```typescript
import { Elysia } from "elysia";
import { db } from "./db/config";
import { users } from "./db/schema";
import { userRoute } from "./routes/user-route"; // ← TAMBAH INI

const app = new Elysia()
  .use(userRoute) // ← TAMBAH INI
  .get("/", () => ({
    message: "Hello World! 🚀 Backend API is running",
    status: "ok",
  }))
  // ... route lainnya
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
  });
```

---

## Cara Testing Manual

### Persiapan

Pastikan MySQL berjalan dan server sudah dijalankan:

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000`

### Test 1 — Registrasi User Baru (Harus Berhasil)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Eko","email":"eko@localhost","password":"rahasia"}'
```

**Response yang diharapkan:**
```json
{"data":"OK"}
```

### Test 2 — Registrasi Ulang Email yang Sama (Harus Error)

Jalankan perintah yang sama persis:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Eko","email":"eko@localhost","password":"rahasia"}'
```

**Response yang diharapkan:**
```json
{"error":"Email sudah terdaftar"}
```

### Test 3 — Verifikasi Password Di-hash di Database

Cek langsung di MySQL bahwa kolom `password` berisi hash bcrypt (dimulai dengan `$2b$`), **bukan** plain text `rahasia`:

```sql
SELECT id, name, email, password, created_at FROM users;
```

Kolom `password` seharusnya terlihat seperti:
```
$2b$10$abcdefghijklmnopqrstuvwxyz...
```

---

## Checklist Implementasi

Gunakan checklist ini untuk memastikan semua pekerjaan sudah selesai:

- [ ] `bcryptjs` sudah ada di `dependencies` dalam `package.json`
- [ ] `@types/bcryptjs` sudah ada di `devDependencies` dalam `package.json`
- [ ] `src/db/schema.ts` sudah memiliki kolom `password`
- [ ] `src/db/schema.ts` sudah menggunakan tipe `timestamp` untuk `createdAt`
- [ ] `src/db/schema.ts` tidak memiliki kolom `updatedAt`
- [ ] Migrasi database sudah dijalankan (`bun run drizzle-kit push`)
- [ ] Tabel `users` di MySQL sudah memiliki kolom `password`
- [ ] File `src/services/user-service.ts` sudah dibuat
- [ ] File `src/routes/user-route.ts` sudah dibuat
- [ ] `src/index.ts` sudah mengimport dan mendaftarkan `userRoute` dengan `.use()`
- [ ] Server bisa berjalan tanpa error (`bun run dev`)
- [ ] Test 1 berhasil — endpoint mengembalikan `{"data":"OK"}`
- [ ] Test 2 berhasil — endpoint mengembalikan `{"error":"Email sudah terdaftar"}`
- [ ] Test 3 berhasil — password tersimpan sebagai bcrypt hash di database
