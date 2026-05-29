const storage = require('../../utils/storage');
const socket = require('../../utils/socket');

Page({
  data: {
    form: {
      playerName: '',
      playerCount: 6,
      showNickname: true,
      allowSkip: true,
    },
    submitting: false,
  },

  onLoad() {
    const lastConfig = storage.getLastConfig();
    this.setData({
      form: {
        playerName: (lastConfig && lastConfig.playerName) || '',
        playerCount: (lastConfig && lastConfig.playerCount) || 6,
        showNickname: lastConfig ? !!lastConfig.showNickname : true,
        allowSkip: lastConfig ? !!lastConfig.allowSkip : true,
      },
    });
  },

  onPlayerNameInput(e) {
    this.setData({ 'form.playerName': e.detail.value });
  },

  onPlayerCountChange(e) {
    this.setData({ 'form.playerCount': Number(e.detail.value) });
  },

  onShowNicknameChange(e) {
    this.setData({ 'form.showNickname': e.detail.value });
  },

  onAllowSkipChange(e) {
    this.setData({ 'form.allowSkip': e.detail.value });
  },

  async onCreateRoom() {
    if (this.data.submitting) return;
    const serverUrl = storage.getServerUrl();
    const form = this.data.form;
    if (Number(form.playerCount) < 3 || Number(form.playerCount) > 12) {
      wx.showToast({ title: '人数需在 3-12', icon: 'none' });
      return;
    }
    try {
      this.setData({ submitting: true });
      await socket.connect(serverUrl);
      const result = await socket.request('create_room', {
        playerName: String(form.playerName || '').trim(),
        config: {
          playerCount: form.playerCount,
          showNickname: !!form.showNickname,
          allowSkip: !!form.allowSkip,
        },
      });
      storage.saveLastConfig({
        playerName: String(form.playerName || '').trim(),
        playerCount: form.playerCount,
        showNickname: !!form.showNickname,
        allowSkip: !!form.allowSkip,
      });
      storage.saveSession(result.session);
      storage.clearCurrentGame();
      wx.reLaunch({ url: '/pages/room/room' });
    } catch (error) {
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
