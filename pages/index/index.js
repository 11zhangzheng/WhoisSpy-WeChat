const storage = require('../../utils/storage');
const socket = require('../../utils/socket');

Page({
  data: {
    serverUrl: '',
    lastConfig: null,
    session: null,
    showRules: false,
  },

  onShow() {
    this.setData({
      serverUrl: storage.getServerUrl(),
      lastConfig: storage.getLastConfig(),
      session: storage.getSession(),
    });
  },

  onServerUrlInput(e) {
    const serverUrl = e.detail.value.trim();
    this.setData({ serverUrl });
    storage.saveServerUrl(serverUrl);
  },

  onContinueRoom() {
    const session = storage.getSession();
    if (!session) return;
    wx.navigateTo({ url: '/pages/room/room' });
  },

  onCreateRoom() {
    wx.navigateTo({ url: '/pages/create/create' });
  },

  onJoinRoom() {
    wx.navigateTo({ url: '/pages/join/join' });
  },

  onWordBank() {
    wx.navigateTo({ url: '/pages/wordbank/wordbank' });
  },

  onRulesToggle() {
    this.setData({ showRules: !this.data.showRules });
  },

  onClearSession() {
    storage.clearSession();
    socket.close();
    this.setData({ session: null });
  },
});
