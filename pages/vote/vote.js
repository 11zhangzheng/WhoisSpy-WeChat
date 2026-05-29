const storage = require('../../utils/storage');
const gameUtil = require('../../utils/game');

Page({
  data: {
    game: null,
    alivePlayers: [],
    currentVoter: null,
    aliveCount: 0,
    allowSkip: true,
    selectedTargetId: '',
    isSkipSelected: false,
    phaseLabel: '',
    voteSummaryList: [],
    autoEliminateTarget: '',
    autoEliminateName: '',
    pendingEliminateTarget: '',
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
    const alivePlayers = gameUtil.getAlivePlayers(currentGame);
    const currentVoter = alivePlayers[currentGame.currentVoteIndex] || null;
    const summary = currentGame.roundSummary || gameUtil.summarizeVotes(currentGame);
    const voteSummaryList = alivePlayers.map((player) => ({
      playerId: player.id,
      name: player.name,
      count: summary.counts[player.id] || 0,
    }));
    const autoEliminateTarget = gameUtil.getTopEliminationTarget(currentGame);
    const matchedPlayer = autoEliminateTarget ? alivePlayers.find((item) => item.id === autoEliminateTarget) : null;
    const autoEliminateName = matchedPlayer ? matchedPlayer.name : '';
    this.setData({
      game: currentGame,
      alivePlayers,
      currentVoter,
      aliveCount: alivePlayers.length,
      allowSkip: !!currentGame.config.allowSkip,
      selectedTargetId: '',
      isSkipSelected: false,
      phaseLabel: currentGame.phase === 'voting' ? '收集投票' : '统计结果',
      voteSummaryList,
      autoEliminateTarget,
      autoEliminateName,
      pendingEliminateTarget: autoEliminateTarget,
    });
  },

  onChooseTarget(e) {
    const targetId = e.currentTarget.dataset.target;
    this.setData({
      selectedTargetId: targetId,
      isSkipSelected: false,
    });
  },

  onSkipVote() {
    this.setData({
      selectedTargetId: '',
      isSkipSelected: true,
    });
  },

  onSubmitVote() {
    const currentGame = storage.getCurrentGame();
    if (!currentGame || currentGame.phase !== 'voting') return;
    if (!this.data.selectedTargetId && !this.data.isSkipSelected) {
      wx.showToast({
        title: '请选择投票对象',
        icon: 'none',
      });
      return;
    }
    gameUtil.collectVote(currentGame, this.data.isSkipSelected ? '' : this.data.selectedTargetId);
    if (currentGame.phase === 'voting_result') {
      currentGame.roundSummary = gameUtil.summarizeVotes(currentGame);
    }
    storage.saveCurrentGame(currentGame);
    this.loadGame();
  },

  onEliminateTarget(e) {
    const targetId = e.currentTarget.dataset.target;
    this.setData({
      pendingEliminateTarget: targetId,
    });
  },

  onConfirmEliminate() {
    const currentGame = storage.getCurrentGame();
    if (!currentGame) return;
    const targetId = this.data.pendingEliminateTarget;
    if (!targetId) return;
    gameUtil.eliminatePlayer(currentGame, targetId);
    storage.saveCurrentGame(currentGame);
    if (currentGame.phase === 'finished') {
      wx.redirectTo({
        url: '/pages/result/result',
      });
      return;
    }
    gameUtil.startNextRound(currentGame);
    storage.saveCurrentGame(currentGame);
    this.loadGame();
  },

  onToResult() {
    wx.redirectTo({
      url: '/pages/result/result',
    });
  },
});
