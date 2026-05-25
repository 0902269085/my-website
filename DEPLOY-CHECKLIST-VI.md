# Ke hoach dua website len internet

## Frontend
- Nen dung Netlify.
- File cau hinh da san o goc repo: `netlify.toml`
- Neu Netlify hoi build settings, nhap:
  - Base directory: `company-website`
  - Build command: `npm run build`
  - Publish directory: `dist/company-website/browser`
- File can doi sau khi co link backend online:
  - `company-website/public/app-config.js`

## Backend
- Nen dung Render Web Service.
- Thu muc backend: `company-backend`
- Build command: `npm install`
- Start command: `npm start`

## Database online
- Nen dung Azure SQL Database.
- Sau khi tao database online, chay file:
  - `company-backend/database/deploy-vibe-website-db.sql`

## Bien can nhap tren Render
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SERVER`
- `DB_PORT`
- `DB_NAME`
- `DB_ENCRYPT=true`
- `DB_TRUST_SERVER_CERTIFICATE=false`

## Checklist test sau khi online
- Mo trang chu co vao duoc khong
- Bam menu cac trang co chuyen duoc khong
- Bam F5 o trang Gioi thieu, Dich vu, Lien he co bi loi khong
- Form lien he co gui duoc khong
- Co thong bao dang gui, gui thanh cong, gui that bai khong
- Du lieu lien he co duoc luu vao database online khong
- Form online hien dang tro ve backend Render: `https://my-website-k8yo.onrender.com`
