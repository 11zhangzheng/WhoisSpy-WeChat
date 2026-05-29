const storage = require('../../utils/storage');
const socket = require('../../utils/socket');

Page({
  data: {
    form: {
      roomCode: '',
      playerName: '',
    },
    submitting: false,
  },

  onRoomCodeInput(e) {
    this.setData({ 'form.roomCode': e.detail.value });
  },

  onPlayerNameInput(e) {
    this.setData({ 'form.playerName': e.detail.value });
  },

  async onJoinRoom() {
    if (this.data.submitting) return;
    const serverUrl = storage.getServerUrl();
    const roomCode = String(this.data.form.roomCode || '').trim();
    const playerName = String(this.data.form.playerName || '').trim();
    if (!roomCode) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    try {
      this.setData({ submitting: true });
      await socket.connect(serverUrl);
      const result = await socket.request('join_room', {
        roomCode,
        playerName,
      });
      storage.saveSession(result.session);
      storage.clearCurrentGame();
      wx.reLaunch({ url: '/pages/room/room' });
    } catch (error) {
      wx.showToast({ title: error.message || '加入失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
