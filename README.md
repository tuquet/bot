<div align="center">
  <img src="https://tuquet.com/icons/telegram-bot.svg" width="76" height="76" alt="Tuquet ChatOps Logo" />
  <h1>Tuquet ChatOps</h1>
  <p><strong>Telegram ChatOps &amp; Infrastructure Server Health Daemon</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Tuquet-ChatOps-blue.svg?logo=telegram" alt="Tuquet ChatOps" />
    <img src="https://img.shields.io/badge/Runtime-Node.js-green.svg" alt="Node.js" />
    <img src="https://img.shields.io/badge/Role-DevOps%20ChatOps-cyan.svg" alt="DevOps ChatOps" />
  </p>
</div>

---

## 1. Cấu Trúc Ứng Dụng

```text
bot/  # (e.g. ~/.specter/bot/ on local workstation or /opt/tuquet/bot/ on Linux server)
├── bin/
│   └── telegram-bot      # CLI quản lý và điều khiển daemon
├── config/
│   ├── .env              # Biến môi trường, Bot token, Whitelist
│   ├── .env.example      # File mẫu cấu hình
│   └── default.json      # Cấu hình danh mục theo dõi và 14 repositories độc lập
├── data/                 # Thư mục dữ liệu ứng dụng
├── logs/                 # Thư mục lưu trữ log
├── scripts/              # Helper scripts
├── src/
│   ├── config.js         # Module nạp config và phân quyền admin
│   ├── index.js          # Entrypoint Bot, router và inline keyboard handlers
│   └── services/
│       ├── github.js     # Tích hợp GitHub Actions (gh CLI)
│       └── system.js     # Giám sát tài nguyên máy chủ & site health
├── install.sh            # Cài đặt tự động & đăng ký systemd
├── uninstall.sh          # Gỡ bỏ sạch sẽ service & symlinks
├── package.json          # Quản lý dependencies (grammy, dotenv)
└── README.md             # Tài liệu này
```

---

## 2. Quản Trị Hệ Thống Qua CLI

Tuquet ChatOps daemon được điều khiển qua binary `telegram-bot` (liên kết toàn cục qua `/usr/local/bin/telegram-bot` trên Linux hoặc nằm trong `PATH` hệ sinh thái `~/.specter/bot/bin/`). Bạn có thể chạy các lệnh quản trị từ bất kỳ đâu:

```bash
# Kiểm tra trạng thái daemon
telegram-bot status

# Xem log thời gian thực
telegram-bot logs

# Khởi động lại bot sau khi cập nhật cấu hình
telegram-bot restart

# Dừng bot
telegram-bot stop

# Chạy bot ở chế độ debug trực tiếp trên terminal
telegram-bot run
```

---

## 3. Danh Mục Lệnh Trong Telegram

| Lệnh | Chức năng | Phân quyền |
| :--- | :--- | :--- |
| `/start` hoặc `/help` | Mở bảng điều khiển với bàn phím nút bấm nhanh (Inline Keyboard) | Tất cả |
| `/ci` hoặc `/ci all` hoặc `/ci <repo>` | Tra cứu trạng thái GitHub Actions (`/ci` mặc định, `/ci all` tổng hợp 14 repositories độc lập, `/ci <repo>` chi tiết) | Tất cả |
| `/deploy` | Kích hoạt build & deploy website tức thì lên GitHub Pages | **Admin Only** |
| `/releases` | Xem danh sách các phiên bản phần mềm phát hành mới nhất từ Releases Portal (toàn bộ 14 repositories độc lập) | Tất cả |
| `/logs` hoặc `/logs <repo>` | Trích xuất tóm tắt log lỗi nếu build bị fail của repo chỉ định | Tất cả |
| `/site` | Kiểm tra HTTP Status, độ trễ và hạn chứng chỉ SSL của website | Tất cả |
| `/server` hoặc `/sys` | Xem thông số CPU load, RAM, Ổ cứng và Uptime của VPS | **Admin Only** |
| `/services` | Xem trạng thái các dịch vụ hệ thống (Docker, SSH, telegram-bot) | **Admin Only** |
| `/repos` | Xem danh sách 14 repositories độc lập của hệ sinh thái Tuquet | Tất cả |

---

## 4. Bảo Mật & Phân Quyền

- Cấu hình file `config/.env` (hoặc `~/.specter/bot/config/.env`):
  - `ALLOWED_CHAT_IDS`: Chỉ nhóm chat hoặc ID người dùng được phép mới có thể tương tác với bot.
  - `ADMIN_USER_IDS`: Chỉ tài khoản admin được cấu hình (ví dụ: `ADMIN_USER_IDS="<your_telegram_id>"`) mới có thể chạy các lệnh nhạy cảm như `/deploy`, `/server`, `/services`.

---

## 5. Reusable GitHub Actions Composite Action

Tuquet ChatOps cung cấp Composite Action chính chủ dùng chung cho toàn bộ ecosystem Tuquet (14 repositories độc lập), giúp loại bỏ hoàn toàn mã lặp (DRY) trong các file workflow:

```yaml
- name: Send Telegram Notification
  if: always()
  uses: tuquet/bot@main
  with:
    bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    status: ${{ job.status }}
```

Đối với các workflow tạo Release:
```yaml
- name: Send Telegram Notification
  if: always()
  uses: tuquet/bot@main
  with:
    bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
    type: 'release'
    tag: ${{ env.RELEASE_TAG }}
```

