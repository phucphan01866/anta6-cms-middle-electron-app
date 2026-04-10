# Báo Cáo Hệ Thống Quản Lý Kết Nối (Backend)

Báo cáo này liệt kê các cấu trúc dữ liệu, trạng thái và logic xử lý liên quan đến 'connection' trong backend của ứng dụng.

## 1. Cấu trúc dữ liệu cốt lõi (socketState.js)

Dữ liệu được quản lý tập trung tại `cms-middle-be/src/socketState.js` dưới dạng các biến toàn cục (in-memory):

| Biến | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `connections` | `Array` | Danh sách metadata các kết nối external (đích đến hoặc nguồn nhận). |
| `servers` | `Map` | Thông tin chi tiết về các SVMS server, khóa theo `server_id`. |
| `devices` | `Map` | Danh sách thiết bị tương ứng với từng server. |
| `clientSockets` | `Object` | Instance của Socket.IO server để push dữ liệu tới Frontend. |

### Chi tiết đối tượng Connection:
```javascript
{
  url: string,             // Định danh (ví dụ: http://192.168.1.10:3000)
  ip: string,              // IP của server đích
  port: number,            // Cổng của server đích
  mode: 'send' | 'receive',// Chế độ: 'send' (vừa nhận vừa forward), 'receive' (chỉ nhận)
  status: string,          // Trạng thái kết nối (xem mục 2)
  server_id: string,       // ID server CMS (mặc định 'PENDING' cho đến khi sync)
  receivedCount: number,   // Tổng số log đã nhận từ nguồn này
  sentCount: number,       // Tổng số log đã forward thành công tới đích này
  accessToken: string      // Token xác thực sau khi login thành công
}
```

## 2. Các trạng thái kết nối (Status)

Hệ thống sử dụng các trạng thái sau để phản ánh sức khỏe của kết nối:

*   **`registered`**: Đã lưu thông tin vào danh sách nhưng chưa thực hiện kiểm tra thực tế.
*   **`connected`**: Đã vượt qua bước kiểm tra sức khỏe (`healthcheck`).
*   **`auth_error`**: Kết nối được nhưng không thể đăng nhập (sai thông tin tài khoản admin).
*   **`unreachable`**: Không thể kết nối tới IP/Port (timeout hoặc server đích đang tắt).
*   **`disconnected`**: Kết nối đã bị người dùng xóa hoặc chủ động ngắt.

## 3. Quy trình thiết lập kết nối

Khi nhận yêu cầu `POST /api/v1/create-connection`, backend thực hiện các bước:
1.  **Check Health**: Gọi `GET /healthcheck` tới target. Nếu thành công, chuyển trạng thái sang `connected`.
2.  **Login**: Gửi thông tin `admin@cms.com` tới target để lấy `accessToken`.
3.  **Sync Data**: Nếu `mode` là `'send'`, tự động gọi hàm `syncDataToTarget` để đẩy thông tin servers/devices hiện có sang target.
4.  **Notify**: Phát sự kiện Socket.IO để cập nhật UI cho toàn bộ client đang mở Dashboard.

## 4. Các sự kiện Socket.IO (Thông báo thời gian thực)

Để đồng bộ trạng thái tới Frontend, hệ thống sử dụng các event:

*   `external-server-connect`: Thông báo có kết nối mới thành công.
*   `external-server-err-connect`: Thông báo lỗi kết nối.
*   `external-server-disconnected`: Thông báo khi một kết nối bị gỡ bỏ.
*   `update-connections`: Gửi toàn bộ danh sách `sendList` và `receiveList`.
*   `update-client`: Cập nhật danh sách các Browser/Dashboard clients đang kết nối.

## 5. API Routes liên quan

*   `GET /api/v1/connections`: Lấy Source of Truth cho giao diện quản lý.
*   `POST /api/v1/create-connection`: Đăng ký và kích hoạt quy trình kết nối.
*   `POST /api/v1/remove-connection`: Xóa cấu hình và ngắt thông báo.
*   `POST /api/v1/disconnect-client`: Force-disconnect một socket client cụ thể.
