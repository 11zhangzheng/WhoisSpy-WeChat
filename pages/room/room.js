const storage = require('../../utils/storage');
const socket = require('../../utils/socket');

function phaseLabel(status) {
  const map = {
    lobby: '等待加入',
    speaking: '顺序发言',
    voting: '匿名投票',
    finished: '游戏结束',
  };
  return map[status] || status;
}

Page({
  data: {
    room: null,
    connected: false,
    loading: true,
    error: '',
    phaseText: '',
    selectedVoteTargetId: '',
  },

  onShow() {
    this.unsubscribe = socket.onMessage((message) => {
      if (message.type === 'event' && message.event === 'room_state') {
        this.applyRoom(message.payload);
      }
      if (message.type === 'close') {
        this.setData({ connected: false });
      }
    });
    this.bootstrap();
  },

  onHide() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  },

  async bootstrap() {
    const session = storage.getSession();
    const serverUrl = storage.getServerUrl();
    if (!session) {
      wx.reLaunch({ url: '/pages/index/index' });
      return;
    }
    try {
      this.setData({ loading: true, error: '' });
      await socket.connect(serverUrl);
      const result = await socket.request('resume_session', session);
      this.applyRoom(result.room);
      this.setData({ connected: true, loading: false });
    } catch (error) {
      this.setData({
        loading: false,
        connected: false,
        error: error.message || '连接失败',
      });
    }
  },

  applyRoom(room) {
    const session = storage.getSession() || {};
    const players = Array.isArray(room.players) ? room.players.slice() : [];
    const voteTally = Array.isArray(room.voteTally) ? room.voteTally.slice() : [];
    const alivePlayers = players.filter((item) => item.alive);
    const localMe = session.playerId ? players.find((item) => item.id === session.playerId) || null : null;
    const myPlayer = room.me || localMe || null;
    const hasVoted = !!(myPlayer && myPlayer.hasVoted);
    const eliminated = players.find((item) => item.id === room.eliminatedPlayerId) || null;
    const selectedWordPair = room.selectedWordPair || null;
    const currentSpeakerSeatNo = Number(room.currentSpeakerSeatNo || 0);
    const canAdvanceSpeaker = room.status === 'speaking'
      && myPlayer
      && myPlayer.alive
      && (myPlayer.id === room.currentSpeakerId || Number(myPlayer.seatNo) === currentSpeakerSeatNo);
    const isCreator = !!(myPlayer && myPlayer.id === room.creatorPlayerId);
    const canRerollWords = room.status === 'speaking' && isCreator && !!(myPlayer && myPlayer.alive);

    const nextRoom = Object.assign({}, room, {
      players,
      lobbyPlayers: players,
      votePlayers: alivePlayers,
      finishedPlayers: players,
      voteTally,
      selectedWordPair,
      myWord: myPlayer && myPlayer.word ? myPlayer.word : '',
      myName: myPlayer ? myPlayer.name : '',
      mySeatNo: myPlayer ? myPlayer.seatNo : 0,
      hasVoted,
      isCreator,
      canRerollWords,
      votedCount: typeof room.votedCount === 'number' ? room.votedCount : 0,
      voteTotal: typeof room.voteTotal === 'number' ? room.voteTotal : 0,
      eliminatedName: room.eliminatedName || (eliminated ? eliminated.name : ''),
      canStartGame: room.status === 'lobby' && isCreator && players.length >= 3,
      canAdvanceSpeaker,
      currentSpeakerSeatNo,
      nextSpeakerText: canAdvanceSpeaker ? '下一位' : '等待当前玩家',
      canVote: room.status === 'voting' && myPlayer && myPlayer.alive && !hasVoted,
    });

    const nextData = {
      room: nextRoom,
      phaseText: phaseLabel(room.status),
      loading: false,
      error: '',
      connected: true,
    };
    if (room.status === 'voting') {
      nextData.selectedVoteTargetId = hasVoted ? (myPlayer.votedTargetId || '') : this.data.selectedVoteTargetId;
    } else {
      nextData.selectedVoteTargetId = '';
    }
    this.setData(nextData);
  },

  async send(action, payload = {}) {
    try {
      const result = await socket.request(action, payload);
      if (result.room) {
        this.applyRoom(result.room);
      }
      return result;
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
      throw error;
    }
  },

  onCopyRoomCode() {
    const room = this.data.room;
    if (!room || !room.roomCode) return;
    wx.setClipboardData({ data: room.roomCode });
  },

  async onRerollWords() {
    await this.send('reroll_words');
  },

  async onStartGame() {
    await this.send('start_game');
  },

  async onNextSpeaker() {
    await this.send('next_speaker');
  },

  onVoteTargetTap(e) {
    this.setData({ selectedVoteTargetId: e.currentTarget.dataset.id });
  },

  async onSubmitVote() {
    const room = this.data.room;
    if (!room) return;
    if (!this.data.selectedVoteTargetId && !room.config.allowSkip) {
      wx.showToast({ title: '不能弃票', icon: 'none' });
      return;
    }
    await this.send('submit_vote', {
      targetId: this.data.selectedVoteTargetId || '',
    });
  },

  async onRestart() {
    await this.send('restart_game');
  },

  onBackHome() {
    storage.clearSession();
    socket.close();
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
