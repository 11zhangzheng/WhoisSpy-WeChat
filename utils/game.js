const WORD_PAIRS = [
  ['苹果', '香蕉'],
  ['电影', '电视剧'],
  ['咖啡', '奶茶'],
  ['地铁', '公交'],
  ['猫', '狗'],
  ['篮球', '足球'],
  ['火锅', '烧烤'],
  ['老师', '班主任'],
  ['手机', '平板'],
  ['高铁', '火车'],
];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function randomWordPair() {
  const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  return {
    civilianWord: pair[0],
    spyWord: pair[1],
  };
}

function normalizeNames(rawNames, count) {
  const names = [];
  for (let i = 0; i < count; i += 1) {
    const value = (rawNames[i] || '').trim();
    names.push(value || `玩家${i + 1}`);
  }
  return names;
}

function buildConfig(input) {
  const words = randomWordPair();
  return {
    playerCount: clampNumber(input.playerCount, 3, 12, 4),
    spyCount: 1,
    wordBankId: '',
    wordBankName: '随机词库',
    civilianWord: words.civilianWord,
    spyWord: words.spyWord,
    showNickname: !!input.showNickname,
    allowSkip: !!input.allowSkip,
    createdAt: Date.now(),
  };
}

function createPlayers(config, rawNames) {
  const names = config.showNickname ? normalizeNames(rawNames, config.playerCount) : Array.from({ length: config.playerCount }, (_, index) => `玩家${index + 1}`);
  const spyIndex = Math.floor(Math.random() * config.playerCount);
  return names.map((name, index) => {
    const isSpy = index === spyIndex;
    return {
      id: uid('player'),
      name,
      seatNo: index + 1,
      role: isSpy ? 'spy' : 'civilian',
      word: isSpy ? config.spyWord : config.civilianWord,
      alive: true,
      eliminatedAt: null,
      voteHistory: [],
    };
  });
}

function createGame(config, rawNames) {
  if (!config.civilianWord || !config.spyWord) {
    const words = randomWordPair();
    config.civilianWord = words.civilianWord;
    config.spyWord = words.spyWord;
    config.wordBankName = config.wordBankName || '随机词库';
  }
  const players = createPlayers(config, rawNames);
  return {
    id: uid('game'),
    config,
    players,
    roundNo: 1,
    phase: 'dealing',
    dealIndex: 0,
    currentVoteIndex: 0,
    votes: [],
    roundSummary: null,
    roundEliminatedPlayerId: '',
    winner: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function getAlivePlayers(game) {
  return game.players.filter((player) => player.alive);
}

function getNextAlivePlayerIndex(game, startIndex) {
  for (let i = startIndex; i < game.players.length; i += 1) {
    if (game.players[i].alive) return i;
  }
  return -1;
}

function collectVote(game, targetId) {
  const alivePlayers = getAlivePlayers(game);
  const voter = alivePlayers[game.currentVoteIndex];
  if (!voter) {
    return game;
  }
  game.votes.push({
    id: uid('vote'),
    voterId: voter.id,
    voterName: voter.name,
    targetId: targetId || '',
    createdAt: Date.now(),
  });
  game.currentVoteIndex += 1;
  if (game.currentVoteIndex >= alivePlayers.length) {
    game.phase = 'voting_result';
    game.roundSummary = summarizeVotes(game);
  }
  game.updatedAt = Date.now();
  return game;
}

function summarizeVotes(game) {
  const counts = {};
  let skipCount = 0;
  game.votes.forEach((vote) => {
    if (!vote.targetId) {
      skipCount += 1;
      return;
    }
    counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  });
  const aliveIds = getAlivePlayers(game).map((player) => player.id);
  const entries = aliveIds.map((id) => ({
    playerId: id,
    count: counts[id] || 0,
  }));
  const maxCount = entries.reduce((max, item) => Math.max(max, item.count), 0);
  const leaders = entries.filter((item) => item.count === maxCount && item.count > 0);
  return {
    counts,
    skipCount,
    leaders,
    maxCount,
  };
}

function eliminatePlayer(game, playerId) {
  const target = game.players.find((player) => player.id === playerId);
  if (!target || !target.alive) return game;
  target.alive = false;
  target.eliminatedAt = Date.now();
  game.roundEliminatedPlayerId = playerId;
  game.phase = 'round_end';
  game.updatedAt = Date.now();
  const winner = checkWinner(game);
  if (winner) {
    game.winner = winner;
    game.phase = 'finished';
  }
  return game;
}

function checkWinner(game) {
  const alivePlayers = getAlivePlayers(game);
  const aliveSpy = alivePlayers.find((player) => player.role === 'spy');
  if (!aliveSpy) {
    return 'civilian';
  }
  if (alivePlayers.length <= 2) {
    return 'spy';
  }
  return '';
}

function startNextRound(game) {
  game.roundNo += 1;
  game.phase = 'voting';
  game.votes = [];
  game.roundSummary = null;
  game.roundEliminatedPlayerId = '';
  game.currentVoteIndex = 0;
  game.updatedAt = Date.now();
  return game;
}

function finishDeal(game) {
  game.phase = 'voting';
  game.currentVoteIndex = 0;
  game.updatedAt = Date.now();
  return game;
}

function getTopEliminationTarget(game) {
  const summary = game.roundSummary || summarizeVotes(game);
  const leaders = summary.leaders || [];
  if (leaders.length === 1) {
    return leaders[0].playerId;
  }
  return '';
}

function cloneGame(game) {
  return JSON.parse(JSON.stringify(game));
}

module.exports = {
  buildConfig,
  createGame,
  createPlayers,
  collectVote,
  summarizeVotes,
  eliminatePlayer,
  startNextRound,
  finishDeal,
  checkWinner,
  getAlivePlayers,
  getTopEliminationTarget,
  cloneGame,
  randomWordPair,
};
