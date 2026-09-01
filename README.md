# HMC Maintenance Management System - FIXED

Versi ini memperbaiki tiga sumber masalah utama:
1. Cloud shift gagal upsert karena `report_month` belum benar-benar memiliki unique index pada database lama.
2. Profile login menghasilkan 406 karena akun Auth bisa ada tanpa baris `profiles`; SQL terbaru membuat trigger + backfill profile otomatis.
3. Breakdown Excel kosong ketika data cloud gagal dimuat; export sekarang memakai data cloud yang sudah dimuat dan juga memasukkan isian form yang belum disimpan sebagai baris sementara.

## 1. Supabase
1. Buka Supabase > SQL Editor.
2. Jalankan SELURUH `supabase.sql` versi ini.
3. Pastikan akun ada di Authentication > Users.
4. Profile akan dibuat otomatis sebagai `technician`.
5. Jika perlu admin, jalankan contoh UPDATE di bagian bawah SQL.

## 2. app.js
Isi hanya:
- `SUPABASE_URL` = URL project Anda (sudah diisi project URL yang digunakan).
- `SUPABASE_ANON_KEY` = Publishable Key / legacy anon key dari Supabase.

JANGAN masukkan `service_role` atau Secret Key ke file frontend.

## 3. Jalankan
Gunakan VS Code + Live Server untuk pengujian lokal, lalu upload seluruh isi folder ke GitHub Pages.

## 4. Alur pengujian
- Login.
- Laporan Shift > isi > Simpan Cloud > refresh > Muat Cloud.
- Breakdown Report > isi form > Simpan Breakdown > data muncul di tabel > Unduh Breakdown Excel.
- Jika form breakdown sudah diisi tetapi belum disimpan, Unduh Excel tetap memasukkan form tersebut agar hasil tidak kosong.

Catatan: peringatan Edge `Tracking Prevention blocked access to storage for cdn.jsdelivr.net` berasal dari library CDN. Library tetap dapat berjalan pada banyak kondisi, tetapi untuk deployment produksi sebaiknya vendor-kan library JS secara lokal agar tidak bergantung CDN.


## Alur Versi Final
- Laporan Shift dibuat satu tanggal per entri. Klik Simpan untuk langsung menyimpan ke Supabase dan data otomatis muncul pada tabel CRUD.
- Breakdown dibuat satu kejadian per entri. Foto dapat dipilih dari device dan disimpan ke Supabase Storage bucket `hmc-breakdown-photos`.
- Tidak diperlukan tombol Muat Cloud untuk alur normal; data dimuat otomatis setelah login, simpan, edit, hapus, dan filter.
- SQL final membuat/memperbaiki tabel, RLS, profile, bucket foto, dan policy Storage.
- Publishable Key sudah ditanam pada `app.js`; publishable key memang dirancang untuk dipakai di sisi client. Jangan pernah memasukkan service_role/secret key.

## FINAL CRUD V2 — Multiple Entries per Date
`report_date` is intentionally NOT UNIQUE. One date can contain multiple shift/event entries. Each entry is identified by its unique `id`. Add creates a new record; Edit/Delete operate by `id`. After saving, the cloud table is refreshed automatically.
