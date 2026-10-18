# VIP Xổ Số Miền Nam — kho dữ liệu

Bộ cập nhật dùng GitHub Actions để lấy dữ liệu từ trang công khai SXMN và lưu thành JSON. **Bộ phân tích HTML phụ thuộc cấu trúc trang nguồn; phải chạy thử và đối chiếu với nguồn chính thức trước khi phát hành.** Nếu trang đổi giao diện, workflow sẽ dừng thay vì cố ghi dữ liệu không chắc chắn.

## Thiết lập miễn phí
1. Tạo repository GitHub mới, ví dụ `vip-xo-so-data`.
2. Tải toàn bộ nội dung thư mục `backend` lên repository đó (bao gồm `.github/workflows/fetch.yml`).
3. Vào **Settings → Actions → General → Workflow permissions**, chọn **Read and write permissions**.
4. Vào **Actions → Update lottery data → Run workflow** để chạy thử.
5. Mở file `data/results/YYYY-MM-DD.json` kiểm tra đủ đài và đủ giải, so sánh với kết quả từ nguồn đáng tin cậy.
6. Workflow tự chạy hàng ngày lúc 18:50 giờ Việt Nam (UTC cron 11:50). Giờ cập nhật thực tế phụ thuộc trang nguồn và GitHub Actions.

## Đường dẫn dữ liệu
- `https://raw.githubusercontent.com/OWNER/REPO/main/data/index.json`
- `https://raw.githubusercontent.com/OWNER/REPO/main/data/results/YYYY-MM-DD.json`

## Cấu trúc JSON
```json
{
  "date": "2026-10-18",
  "fetchedAt": "2026-10-18T11:50:00.000Z",
  "source": "https://www.sxmn.com.vn/",
  "results": [
    {
      "id": "2026-10-18-Can Tho",
      "date": "2026-10-18",
      "province": "Cần Thơ",
      "region": "Miền Nam",
      "prizes": {
        "eighthPrize": "12",
        "seventhPrize": "123",
        "sixthPrize": ["1234", "5678", "9012"],
        "fifthPrize": "1234",
        "fourthPrize": ["12345"],
        "thirdPrize": ["12345", "67890"],
        "secondPrize": "12345",
        "firstPrize": "12345",
        "specialPrize": "123456"
      }
    }
  ]
}
```

Số trong JSON luôn là **chuỗi** để giữ số 0 ở đầu. Dữ liệu mẫu ở trên chỉ minh họa định dạng, không phải kết quả thật.
