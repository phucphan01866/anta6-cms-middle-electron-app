import { io } from 'socket.io-client';

const getBeHost = () => localStorage.getItem('BE_HOST') || import.meta.env.VITE_BE_HOST || 'localhost';
const getBePort = () => localStorage.getItem('BE_PORT') || import.meta.env.VITE_BE_PORT || '5050';
const beURL = `http://${getBeHost()}:${getBePort()}`;

export const socket = io(beURL, {
  reconnection: true,             // Bật tính năng tự động kết nối lại
  reconnectionAttempts: Infinity, // Số lần thử kết nối (Infinity = vô hạn)
  reconnectionDelay: 3000,        // Thời gian chờ trươc khi thử lại (3s)
  reconnectionDelayMax: 3000,     // Thời gian chờ tối đa (để cố định ở 3s)
  randomizationFactor: 0          // Bỏ qua độ trễ ngẫu nhiên
});
console.log('connecting to: ', beURL, socket)

socket.io.on("reconnect_attempt", (attempt) => {
  console.log(`Đang thử kết nối lại... (Lần ${attempt}) với socket: ${beURL}`);
  console.table(` ${socket}`)
});

// reset socket
export const updateSocketUrlAsync = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    socket.disconnect();
    (socket.io as any).opts.timeout = 1000;
    (socket.io as any).uri = url;
    // Lắng nghe sự kiện kết nối thành công
    const onConnect = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      console.log("connected");
      resolve(true);
    };
    const onError = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      console.log("error");
      resolve(false);
    };
    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.connect();
  });
};
