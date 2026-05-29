let socketTask = null;
let socketOpen = false;
let connectTimer = null;
let nextRequestId = 1;
const pending = new Map();
const listeners = new Set();
const CONNECT_TIMEOUT_MS = 8000;

function connect(url) {
  if (socketTask && socketOpen) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    socketTask = wx.connectSocket({ url });
    connectTimer = setTimeout(() => {
      if (socketOpen) return;
      try {
        socketTask && socketTask.close();
      } catch (error) {}
      socketTask = null;
      reject(new Error('连接超时'));
    }, CONNECT_TIMEOUT_MS);
    socketTask.onOpen(() => {
      socketOpen = true;
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      resolve();
    });
    socketTask.onError((error) => {
      socketOpen = false;
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      reject(error);
    });
    socketTask.onClose(() => {
      socketOpen = false;
      socketTask = null;
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
      pending.forEach(({ reject }) => reject(new Error('socket closed')));
      pending.clear();
      listeners.forEach((fn) => fn({ type: 'close' }));
    });
    socketTask.onMessage((message) => {
      let data;
      try {
        data = JSON.parse(message.data);
      } catch (error) {
        return;
      }
      if (data.type === 'response' && data.requestId && pending.has(data.requestId)) {
        const entry = pending.get(data.requestId);
        pending.delete(data.requestId);
        if (data.ok) {
          entry.resolve(data.payload);
        } else {
          entry.reject(new Error(data.error || '请求失败'));
        }
        return;
      }
      listeners.forEach((fn) => fn(data));
    });
  });
}

function request(action, payload = {}) {
  if (!socketTask || !socketOpen) {
    return Promise.reject(new Error('socket not connected'));
  }
  const requestId = `req_${Date.now()}_${nextRequestId++}`;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    wx.sendSocketMessage({
      data: JSON.stringify({
        type: 'request',
        requestId,
        action,
        payload,
      }),
      fail: (error) => {
        pending.delete(requestId);
        reject(error);
      },
    });
  });
}

function onMessage(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

function close() {
  if (socketTask) {
    socketTask.close();
  }
}

module.exports = {
  connect,
  request,
  onMessage,
  close,
};
