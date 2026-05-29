const storage = require('../../utils/storage');
const gameUtil = require('../../utils/game');

Page({
  data: {
    game: null,
    currentPlayer: null,
    showWord: false,
    isLastPlayer: false,
  },

  onShow() {
    this.loadGame();
  },

  loadGame() {
    const currentGame = storage.getCurrentGame();
    if (!currentGame) {
      wx.redirectTo({
        url: '/pages/create/create',
      });
      return;
    }
    const nextIndex = currentGame.dealIndex || 0;
    const currentPlayer = currentGame.players[nextIndex] || currentGame.players[0];
    this.setData({
      game: currentGame,
      currentPlayer,
      showWord: false,
      isLastPlayer: nextIndex >= currentGame.players.length - 1,
    });
  },

  onToggleWord() {
    this.setData({
      showWord: !this.data.showWord,
    });
  },

  onNextPlayer() {
    const currentGame = storage.getCurrentGame();
    if (!currentGame) return;
    if (currentGame.dealIndex >= currentGame.players.length - 1) {
      currentGame.phase = 'voting';
      currentGame.currentVoteIndex = 0;
      currentGame.votes = [];
      currentGame.roundSummary = null;
      currentGame.roundEliminatedPlayerId = '';
      currentGame.updatedAt = Date.now();
      storage.saveCurrentGame(currentGame);
      wx.redirectTo({
        url: '/pages/vote/vote',
      });
      return;
    }
    currentGame.dealIndex += 1;
    currentGame.updatedAt = Date.now();
    storage.saveCurrentGame(currentGame);
    const nextPlayer = currentGame.players[currentGame.dealIndex];
    this.setData({
      game: currentGame,
      currentPlayer: nextPlayer,
      showWord: false,
      isLastPlayer: currentGame.dealIndex >= currentGame.players.length - 1,
    });
  },
});
