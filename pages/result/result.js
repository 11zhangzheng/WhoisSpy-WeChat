const storage = require('../../utils/storage');

Page({
  data: {
    game: null,
    players: [],
  },

  onShow() {
    const currentGame = storage.getCurrentGame();
    if (!currentGame || currentGame.phase !== 'finished') {
      wx.redirectTo({
        url: '/pages/vote/vote',
      });
      return;
    }
    this.setData({
      game: currentGame,
      players: currentGame.players,
    });
  },

  onRestart() {
    storage.clearCurrentGame();
    wx.redirectTo({
      url: '/pages/create/create',
    });
  },

  onHome() {
    storage.clearCurrentGame();
    wx.reLaunch({
      url: '/pages/index/index',
    });
  },
});
