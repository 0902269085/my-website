# Huong dan dua website len internet cho nguoi moi

## A. GitHub

Phan nay da xong.

- Repo: `https://github.com/0902269085/my-website.git`
- Code da duoc day len GitHub.

## B. Render cho backend

Muc tieu:
- tao noi xu ly form lien he online

Lam nhu sau trong Render:

1. Dang nhap Render
2. Bam `New +`
3. Chon `Web Service`
4. Chon repo: `0902269085/my-website`
5. Neu Render hoi cach cau hinh:
   - Root Directory: `company-backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Neu Render hoi Environment Variables, nhap tam:
   - `PORT = 3000`
   - `FRONTEND_URL = https://your-site.netlify.app`
   - `ALLOWED_ORIGINS = https://your-site.netlify.app`
   - `DB_USER =` se nhap sau khi tao Azure
   - `DB_PASSWORD =` se nhap sau khi tao Azure
   - `DB_SERVER =` se nhap sau khi tao Azure
   - `DB_PORT = 1433`
   - `DB_NAME = VibeWebsiteDb`
   - `DB_ENCRYPT = true`
   - `DB_TRUST_SERVER_CERTIFICATE = false`

Neu da co service `https://my-website-k8yo.onrender.com`:
- vao service do
- bam `Settings`
- kiem tra co dung repo `0902269085/my-website` khong
- kiem tra `Root Directory` la `company-backend`
- kiem tra `Start Command` la `npm start`

## C. Azure SQL cho noi luu du lieu

Muc tieu:
- tao noi luu form lien he online

Lam nhu sau trong Azure Portal:

1. Dang nhap Azure Portal
2. O o tim kiem tren cung, go `SQL databases`
3. Bam `Create`
4. O muc `Resource group`
   - neu co san thi chon 1 cai
   - neu chua co thi bam `Create new`
   - go ten de nho, vi du: `my-website-rg`
5. O `Database name`, nhap: `VibeWebsiteDb`
6. O `Server`, bam `Create new`
7. Dien:
   - Server name: mot ten bat ky chua bi trung, vi du `mywebsitecapserver`
   - Location: chon noi gan ban, vi du `Southeast Asia`
   - Authentication method: chon `Use SQL authentication`
   - Server admin login: vi du `sqladmincap`
   - Password: tu dat mat khau
   - Confirm password: nhap lai
8. O phan tinh phi, chon goi hoc tap/thap nhat ma Azure cho phep
9. Bam `Review + create`
10. Bam `Create`

Sau khi tao xong:

1. Mo database `VibeWebsiteDb`
2. Vao muc `Query editor`
3. Dang nhap bang:
   - user: ten admin vua tao
   - password: mat khau vua tao
4. Mo file:
   - `company-backend/database/deploy-vibe-website-db.sql`
5. Copy toan bo noi dung file do vao Query editor
6. Bam `Run`

Sau buoc nay, Azure da co cho luu form lien he.

## D. Dien lai thong tin Azure vao Render

Quay lai Render, mo service backend, vao `Environment`.

Nhap:
- `DB_USER =` ten admin Azure, vi du `sqladmincap`
- `DB_PASSWORD =` mat khau Azure
- `DB_SERVER =` ten server Azure day du, vi du `mywebsitecapserver.database.windows.net`
- `DB_PORT = 1433`
- `DB_NAME = VibeWebsiteDb`
- `DB_ENCRYPT = true`
- `DB_TRUST_SERVER_CERTIFICATE = false`

Sau do bam `Save`, roi `Manual Deploy` neu Render yeu cau.

## E. Netlify cho frontend

Muc tieu:
- dua giao dien website len internet

Lam nhu sau trong Netlify:

1. Dang nhap Netlify
2. Bam `Add new site`
3. Chon `Import an existing project`
4. Chon `GitHub`
5. Chon repo: `0902269085/my-website`
6. Neu Netlify hoi Build settings, nhap:
   - Base directory: `company-website`
   - Build command: `npm run build`
   - Publish directory: `dist/company-website/browser`
7. Bam `Deploy site`

Neu deploy thanh cong, ban se co link dang:
- `https://ten-bat-ky.netlify.app`

## F. Noi frontend voi backend

Sau khi co link Netlify:

1. Mo file `company-website/public/app-config.js`
2. Giu nguyen:
   - `apiBaseUrl: '/api'`

Khong can sua file nay neu ban dung Netlify proxy.

3. Quay lai Render
4. Sua:
   - `FRONTEND_URL = link Netlify cua ban`
   - `ALLOWED_ORIGINS = link Netlify cua ban`

Vi du:
- `FRONTEND_URL = https://the-swan-ateliere.netlify.app`
- `ALLOWED_ORIGINS = https://the-swan-ateliere.netlify.app`

## G. Cach biet da xong

Website da len internet dung khi:
- mo link Netlify thay trang chu
- bam vao trang Lien he duoc
- gui form thay thong bao thanh cong
- backend Render tra loi duoc
- du lieu vao Azure SQL
