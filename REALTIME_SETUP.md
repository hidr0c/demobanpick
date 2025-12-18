# 🚀 Realtime Sync với Socket.IO

## ✅ Đã hoàn thành

Hệ thống realtime database đã được triển khai sử dụng **Socket.IO** để sync dữ liệu giữa tất cả các tab/device kết nối tới localhost:3000.

### Những gì đã thay đổi:

1. **Socket.IO Server** (`server.js`)
   - Custom Node.js server tích hợp với Next.js
   - Quản lý game state trong memory
   - Broadcast events tới tất cả clients đang kết nối
   - Hỗ trợ save/load JSON files

2. **Socket Client Library** (`src/app/lib/socketClient.ts`)
   - Singleton socket connection
   - Auto-reconnect khi mất kết nối
   - Helper functions để emit/listen events
   - Type-safe với TypeScript

3. **Updated Hooks** (`src/app/hooks/useGame.ts`)
   - `useGameDisplay()`: Listen-only cho display pages
   - `useGameController()`: Full control cho controller page
   - Realtime sync state giữa tất cả clients
   - Connection status tracking

4. **Package.json**
   - Thêm `socket.io` và `socket.io-client`
   - Updated dev script để dùng custom server

## 🎮 Cách sử dụng

### Khởi động server:

```bash
npm run dev
```

Server sẽ chạy trên: **http://localhost:3000**

### Test realtime sync:

1. Mở **Controller** page: `http://localhost:3000/controller`
2. Mở **Match Display** trong tab/browser khác: `http://localhost:3000/match-display`
3. Mở **Results** trong tab thứ 3: `http://localhost:3000/results`
4. Thử tương tác trên Controller → Tất cả pages sẽ sync realtime! ✨

### Các events được sync:

- ✅ Settings Update (pool, randomCount, pickCount, banCount)
- ✅ Random Start/Animation/Complete
- ✅ Show Ban/Pick phase
- ✅ Ban Song / Pick Song
- ✅ Show Final Results
- ✅ Go to Match Display
- ✅ Match Next/Prev
- ✅ Reset Game

## 🌐 Cross-device sync

Để sync giữa nhiều devices:

1. Tìm local IP của máy chạy server (ví dụ: `192.168.1.100`)
2. Update socket URL trong `socketClient.ts`:
   ```typescript
   const socket = io('http://192.168.1.100:3000', {
     // ...
   });
   ```
3. Các devices khác trong cùng mạng LAN có thể truy cập và sync!

## 📊 Connection Status

Mỗi hook giờ trả về `isConnected` để theo dõi trạng thái kết nối:

```typescript
const { state, isConnected } = useGameDisplay();

// Hiển thị indicator
{!isConnected && <div>Đang kết nối...</div>}
```

## 🔧 Troubleshooting

**Nếu không sync được:**
- Kiểm tra console log: "✅ Socket.IO connected"
- Đảm bảo server đang chạy: `npm run dev`
- Check firewall/antivirus không block port 3000
- Xem Socket.IO debug logs trên server console

**JSON files:**
- Game state được lưu trong memory (server.js)
- Pool files vẫn load từ `/public/pools/*.json`
- Có thể extend để save/load từ JSON files bằng events

## 🎯 Next Steps (Optional)

- [ ] Persist game state to JSON file on server
- [ ] Add authentication/rooms cho multiple matches
- [ ] Deploy lên VPS/Cloud để public access
- [ ] Add replay/history feature
- [ ] Database migration (PostgreSQL/MongoDB) nếu cần scale

---

**Giờ đây Controller page sync realtime với tất cả display pages! 🎊**
