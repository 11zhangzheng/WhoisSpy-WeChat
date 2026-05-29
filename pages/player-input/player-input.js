const storage = require('../../utils/storage');
const game = require('../../utils/game');

Page({
  data: {
    config: null,
    names: [],
    showNickname: true,
  },

  onShow() {
    const config = storage.getLastConfig();
    if (!config) {
      wx.showToast({
        title: '请先创建房间',
        icon: 'none',
      });
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/create/create',
        });
      }, 500);
      return;
    }
    const names = Array.from({ length: config.playerCount }, (_, index) => `玩家${index + 1}`);
    this.setData({
      config,
      names,
      showNickname: !!config.showNickname,
    });
  },

  onNameInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const names = this.data.names.slice();
    names[index] = e.detail.value;
    this.setData({
      names,
    });
  },

  onStartGame() {
    const config = this.data.config;
    if (!config) return;
    const names = config.showNickname ? this.data.names : Array.from({ length: config.playerCount }, (_, index) => `玩家${index + 1}`);
    const invalid = config.showNickname && names.some((name) => !String(name || '').trim());
    if (invalid) {
      wx.showToast({
        title: '请补全所有昵称',
        icon: 'none',
      });
      return;
    }
    const finalNames = config.showNickname ? names : [];
    const currentGame = game.createGame(config, finalNames);
    storage.saveCurrentGame(currentGame);
    wx.redirectTo({
      url: '/pages/deal/deal',
    });
  },

  onBack() {
    wx.navigateBack();
  },
});
