const fs = require('fs');
const path = require('path');
const os = require('os');

// Tìm thư mục AppData trên Windows, Mac, Linux
const getAppDataPath = () => {
  switch (process.platform) {
    case 'darwin': {
      return path.join(os.homedir(), 'Library', 'Application Support');
    }
    case 'win32': {
      return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    }
    default: {
      return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    }
  }
};

const appDataPath = getAppDataPath();

// Electron thường lưu dữ liệu dưới tên gói (name trong package.json) lúc dev
// và productName lúc build. Ta sẽ thử xóa cả hai thư mục nếu tồn tại.
const appNames = ['cms-electron-app', 'CMS Middle', 'cms-middle'];

console.log('[clear-storage] Bắt đầu dọn dẹp bộ nhớ đệm (localStorage/session)...');

let deletedAny = false;

appNames.forEach((appName) => {
  const targetPath = path.join(appDataPath, appName);

  if (fs.existsSync(targetPath)) {
    try {
      // Xóa toàn bộ thư mục dữ liệu của ứng dụng
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`[clear-storage] ✅ Đã xóa tệp dữ liệu tại: ${targetPath}`);
      deletedAny = true;
    } catch (err) {
      console.error(`[clear-storage] ❌ Không thể xóa ${targetPath}:`, err.message);
      console.log('                 Vui lòng đảm bảo rằng ứng dụng Electron ĐÃ ĐƯỢC TẮT.');
    }
  }
});

if (!deletedAny) {
  console.log('[clear-storage] ⚠️ Không tìm thấy thư mục dữ liệu nào cần xóa. Ứng dụng của bạn đã sạch.');
} else {
  console.log('[clear-storage] ✨ Hoàn tất! Vui lòng chạy lại `yarn dev`. localStorage đã bị làm sạch toàn bộ.');
}
