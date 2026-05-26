# AGENTS.md

Bạn đang làm việc trong một codebase thật đang được dùng cho website công ty. Mục tiêu là viết code dễ đọc, dễ sửa, và hòa vào code sẵn có như một thành viên cẩn thận trong team.

## Mục tiêu chính

Khi sửa code trong repo này, luôn ưu tiên:

- đọc được nhanh
- logic dễ lần theo
- ít thay đổi nhất có thể
- giống style của file xung quanh
- đủ rõ cho người mới theo được

Kết quả cuối cùng không nên trông như một bản refactor quá tay hoặc một đoạn code "quá thông minh".

## Repo này gồm gì

Workspace hiện tại có 2 phần:

- `company-website`: frontend Angular
- `company-backend`: backend Node.js dùng Express và `mssql`

Trước khi sửa code, luôn xác định mình đang sửa ở đâu:

- nếu là giao diện, route, form, component, SCSS: thường ở `company-website`
- nếu là API, validate request, kết nối database, CORS, env: thường ở `company-backend`
- nếu thay đổi dữ liệu đi từ frontend sang backend: phải đọc cả 2 bên trước khi sửa

## Cách làm việc trong repo này

Trước khi viết code, luôn làm theo thứ tự này:

1. đọc kỹ task
2. xác định file thuộc frontend hay backend
3. đọc các file gần đó đang làm việc tương tự
4. bắt chước đúng pattern tại chỗ đó
5. chỉ sửa phần thật sự cần

Không tự mở rộng phạm vi nếu task không yêu cầu.

Không nên:

- refactor lan sang module khác
- đổi tên biến, hàm, file không liên quan
- tạo thêm abstraction chỉ để code trông sạch hơn
- thay style code cũ bằng style mới chỉ vì thấy đẹp hơn
- sửa nhiều file nếu một file là đủ

## Quy tắc chung khi viết code

- Ưu tiên code bình thường, rõ ràng, dễ debug.
- Ưu tiên flow từng bước thay vì viết gọn quá mức.
- Nếu xung quanh đang viết theo một style cụ thể, làm theo style đó.
- Nếu có nhiều style khác nhau trong repo, lấy style gần file đang sửa làm chuẩn.
- Không thêm comment mặc định.
- Chỉ thêm comment khi task yêu cầu hoặc khu vực đó đã có sẵn kiểu comment tương tự và thật sự cần để maintain.
- Không để lại TODO, placeholder, hoặc code nửa chừng.

## Cách đặt tên

Ưu tiên tên phản ánh đúng ý nghĩa nghiệp vụ hoặc đúng vai trò của dữ liệu.

Nên dùng tên thể hiện:

- dữ liệu đó là gì
- hàm đó làm việc gì
- giá trị đó dùng trong bước nào

Hạn chế các tên quá chung chung như:

- `data`
- `item`
- `temp`
- `value`
- `result`
- `payload`
- `handleData`
- `processData`

## Quy tắc đọc và sửa code

- Đừng viết lại đoạn code đang chạy ổn nếu task không bắt buộc.
- Đừng tách nhỏ thành nhiều helper nếu file xung quanh không theo kiểu đó.
- Đừng thêm kiến trúc mới cho một thay đổi nhỏ.
- Nếu có thể dùng early return để flow dễ đọc hơn, có thể dùng.
- Tránh lồng điều kiện quá sâu nếu có cách viết đơn giản hơn.
- Ưu tiên code mà một bạn junior có thể hiểu trong khoảng 30 giây.

## Hướng dẫn cho `company-website` (Angular)

Frontend hiện tại là Angular dùng cấu trúc đơn giản, gần với site giới thiệu công ty hơn là một app phức tạp.

### Những gì cần nhớ

- Dự án đang dùng standalone component.
- Route chính nằm ở `src/app/app.routes.ts`.
- Layout chung nằm trong `src/app/layouts`.
- Các trang nằm trong `src/app/pages`.
- Dữ liệu tĩnh hiện đang đặt ở `src/app/core/data/company.data.ts`.
- Các API service nằm trong `src/app/core/services`.
- Cấu hình base URL API nằm ở `src/app/core/config/api.config.ts`.

### Khi sửa Angular

- Đọc component `.ts`, template `.html`, style `.scss` và service liên quan trước khi sửa.
- Giữ logic template đơn giản.
- Đừng nhét quá nhiều xử lý nghiệp vụ trực tiếp vào HTML.
- Nếu một trang đang tự gọi service trong component, tiếp tục theo pattern đó thay vì tự nghĩ ra tầng mới.
- Nếu một dữ liệu đang lấy từ `company.data.ts`, đừng tự ý chuyển sang API nếu task không yêu cầu.
- Nếu một dữ liệu đang lấy từ API, kiểm tra luôn response shape của backend trước khi đổi field.
- Tái sử dụng service đang có thay vì hardcode URL trong component.
- Giữ kiểu viết tương tự vùng hiện tại: `inject(...)`, property rõ ràng, hàm ngắn và dễ đọc.
- Không tự thêm state management, signal store, ngrx, hay pattern reactive khác nếu khu vực đó chưa dùng.

### Với form Angular

- Giữ validate rõ ràng, dễ lần theo.
- Nếu component hiện tại đang tự kiểm tra field thiếu rồi mới gọi API, tiếp tục theo cách đó.
- Giữ thông báo lỗi/thành công theo cách component đó đang làm.
- Nếu đổi payload gửi đi, phải kiểm tra luôn backend route đang nhận gì.

### Với giao diện

- Ưu tiên sửa ngay trong component/page liên quan.
- Giữ tên class CSS, cách chia section, và mức độ chi tiết giống file bên cạnh.
- Không đổi layout toàn trang nếu task chỉ yêu cầu sửa một khối nhỏ.

## Hướng dẫn cho `company-backend` (Node.js)

Backend hiện tại là Node.js đơn giản với Express, không phải kiến trúc nhiều tầng phức tạp.

### Những gì cần nhớ

- Entry point ở `src/server.js` và `src/app.js`.
- Cấu hình môi trường ở `src/config/env.js`.
- Kết nối database ở `src/config/database.js`.
- API routes hiện nằm trong `src/routes`.
- Database đang dùng `mssql`.

### Khi sửa backend

- Đọc route gần nhất đang làm việc tương tự trước.
- Giữ flow hiện tại: nhận request, chuẩn hóa dữ liệu, validate, gọi database, trả JSON response.
- Không tự thêm repository, service layer, controller layer, validator framework, hoặc kiến trúc mới nếu task không yêu cầu.
- Nếu route hiện tại đang validate trực tiếp trong file route, tiếp tục theo pattern đó.
- Response nên giữ cùng kiểu với route lân cận: thường là `ok`, `message`, và khi cần thì có `data`.
- Nếu sửa CORS hoặc env, đọc cả `src/app.js` và `src/config/env.js` trước khi thay đổi.

### Với database

- Không đổi schema nếu task không yêu cầu.
- Không đổi tên cột, tên field, hoặc cấu trúc response một cách âm thầm.
- Khi viết query, giữ cách bind parameter như các route hiện có.
- Nếu backend đang trả về field nào cho frontend, phải kiểm tra frontend có đang dùng field đó không.

## Khi task chạm cả frontend và backend

Đây là phần dễ gây lỗi nhất, nên luôn kiểm tra theo cặp:

1. frontend đang gửi gì hoặc đang cần nhận gì
2. backend route đang nhận gì hoặc đang trả gì
3. tên field có khớp nhau không
4. kiểu dữ liệu có khớp nhau không
5. thông báo lỗi/thành công có còn phù hợp không

Không tự ý đổi:

- tên field trong payload
- shape response API
- đường dẫn route
- base URL API
- cách frontend fallback từ dữ liệu tĩnh sang API

trừ khi task yêu cầu rõ.

## Tránh mùi "AI-generated"

Trong repo này, đừng làm code trông quá bóng bẩy so với phần còn lại.

Tránh:

- over-abstraction
- tạo helper không thật sự cần
- viết map/filter/reduce quá dày khi code tuần tự dễ hiểu hơn
- đổi quá nhiều chỉ để "clean"
- đặt tên quá chung chung hoặc quá học thuật
- tách nhỏ quá mức làm người đọc phải nhảy nhiều file

Hãy viết như một đồng đội cẩn thận đang sửa một phần nhỏ trong ngày làm việc bình thường.

## Checklist trước khi kết thúc

Trước khi chốt thay đổi, tự kiểm tra:

1. mình đã đọc file gần đó chưa
2. phần sửa có bám đúng pattern cũ không
3. có đang sửa quá phạm vi task không
4. có đổi contract FE/BE ngoài ý muốn không
5. người mới đọc vào có hiểu nhanh được không

## Tiêu chuẩn cuối cùng

Thay đổi được xem là tốt khi:

- người khác đọc vào không bị khựng vì style lạ
- logic đủ rõ để debug lại sau này
- người mới vẫn lần được luồng chạy
- code nhìn giống phần còn lại của repo
- phạm vi thay đổi gọn và an toàn
