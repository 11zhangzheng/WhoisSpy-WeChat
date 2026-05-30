const storage = require('../../utils/storage');
const socket = require('../../utils/socket');

Page({
  data: {
    form: {
      roomName: '',
      playerName: '',
      playerCount: 8,
      spyCount: 1,
      rounds: 3,
      dealTime: 30,
      discussTime: 60,
      wordBankName: '',
      allowSpectate: true,
      showNickname: true,
      allowSkip: true,
    },
    submitting: false,
  },

  onLoad() {
    const lastConfig = storage.getLastConfig();
    this.setData({
      form: {
        roomName: (lastConfig && lastConfig.roomName) || '',
        playerName: (lastConfig && lastConfig.playerName) || '',
        playerCount: (lastConfig && lastConfig.playerCount) || 8,
        spyCount: (lastConfig && lastConfig.spyCount) || 1,
        rounds: (lastConfig && lastConfig.rounds) || 3,
        dealTime: (lastConfig && lastConfig.dealTime) || 30,
        discussTime: (lastConfig && lastConfig.discussTime) || 60,
        wordBankName: (lastConfig && lastConfig.wordBankName) || '',
        allowSpectate: lastConfig ? !!lastConfig.allowSpectate : true,
        showNickname: lastConfig ? !!lastConfig.showNickname : true,
        allowSkip: lastConfig ? !!lastConfig.allowSkip : true,
      },
    });
  },

  onRoomNameChange(e) {
    this.setData({ 'form.roomName': e.detail.value });
  },

  onPlayerNameInput(e) {
    this.setData({ 'form.playerName': e.detail.value });
  },

  onPlayerCountChange(e) {
    this.setData({ 'form.playerCount': Number(e.detail.value) });
  },

  onSpyCountChange(e) {
    this.setData({ 'form.spyCount': Number(e.detail.value) });
  },

  onRoundsChange(e) {
    this.setData({ 'form.rounds': Number(e.detail.value) });
  },

  onDealTimeChange(e) {
    this.setData({ 'form.dealTime': Number(e.detail.value) });
  },

  onDiscussTimeChange(e) {
    this.setData({ 'form.discussTime': Number(e.detail.value) });
  },

  onWordBankTap() {
    wx.navigateTo({ url: '/pages/wordbank/wordbank' });
  },

  onAllowSpectateChange(e) {
    this.setData({ 'form.allowSpectate': e.detail.value });
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
          roomName: String(form.roomName || '').trim(),
          playerCount: form.playerCount,
          spyCount: form.spyCount,
          rounds: form.rounds,
          dealTime: form.dealTime,
          discussTime: form.discussTime,
          allowSpectate: !!form.allowSpectate,
          showNickname: !!form.showNickname,
          allowSkip: !!form.allowSkip,
        },
      });
      storage.saveLastConfig({
        roomName: String(form.roomName || '').trim(),
        playerName: String(form.playerName || '').trim(),
        playerCount: form.playerCount,
        spyCount: form.spyCount,
        rounds: form.rounds,
        dealTime: form.dealTime,
        discussTime: form.discussTime,
        wordBankName: form.wordBankName,
        allowSpectate: !!form.allowSpectate,
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
