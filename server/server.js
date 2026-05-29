const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3001);
const rooms = new Map();
const connections = new Map();

const WORD_POOLS = [
  ['苹果', '香蕉'],
  ['西瓜', '哈密瓜'],
  ['电影', '电视剧'],
  ['咖啡', '奶茶'],
  ['地铁', '公交'],
  ['猫', '狗'],
  ['篮球', '足球'],
  ['火锅', '烧烤'],
  ['老师', '班主任'],
  ['手机', '平板'],
  ['高铁', '火车'],
  ['面包', '蛋糕'],
  ['电脑', '笔记本'],
  ['铅笔', '圆珠笔'],
  ['键盘', '鼠标'],
  ['太阳', '月亮'],
  ['下雨', '刮风'],
  ['橙子', '橘子'],
  ['洗发水', '沐浴露'],
  ['纸巾', '湿巾'],
  ['牙膏', '牙刷'],
  ['雪糕', '冰淇淋'],
  ['牛奶', '豆浆'],
  ['可乐', '雪碧'],
  ['白天', '黑夜'],
  ['医生', '护士'],
  ['银行', '证券'],
  ['雨伞', '雨衣'],
  ['泳池', '澡堂'],
  ['出租车', '网约车'],
  ['地铁站', '公交站'],
  ['书包', '手提包'],
  ['围巾', '帽子'],
  ['跑步', '散步'],
  ['唱歌', '跳舞'],
  ['摄影', '录像'],
  ['游泳', '潜水'],
  ['煎饼', '油条'],
  ['米饭', '面条'],
  ['饺子', '包子'],
  ['海盐', '食盐'],
  ['山峰', '山谷'],
  ['湖泊', '河流'],
  ['海洋', '大海'],
  ['春天', '秋天'],
  ['早晨', '傍晚'],
  ['清晨', '黄昏'],
  ['卧室', '客厅'],
  ['厨房', '餐厅'],
  ['电视', '投影仪'],
  ['电影票', '演出票'],
  ['音乐', '播客'],
  ['小说', '漫画'],
  ['面试', '考试'],
  ['作业', '试卷'],
  ['历史', '地理'],
  ['数学', '英语'],
  ['微信', '短信'],
  ['快递', '外卖'],
  ['银行卡', '会员卡'],
  ['雨伞', '遮阳伞'],
  ['蜡烛', '手电筒'],
  ['牙签', '棉签'],
  ['毛巾', '浴巾'],
  ['运动鞋', '皮鞋'],
  ['羽绒服', '大衣'],
  ['电脑包', '背包'],
  ['钥匙', '门禁卡'],
  ['闹钟', '手机铃'],
  ['公交车', '地铁'],
  ['便利店', '超市'],
  ['菜市场', '商场'],
  ['豆腐', '豆皮'],
  ['牛肉', '羊肉'],
  ['鸡蛋', '鸭蛋'],
  ['冰箱', '冰柜'],
  ['风扇', '空调'],
  ['口红', '唇膏'],
  ['香水', '精油'],
  ['早饭', '午饭'],
  ['午饭', '晚饭'],
  ['电影海报', '剧照'],
  ['牙刷', '刮胡刀'],
  ['纸杯', '塑料杯'],
  ['书签', '便签'],
  ['手表', '手环'],
  ['电脑键盘', '机械键盘'],
  ['手电筒', '台灯'],
  ['抽屉', '柜子'],
  ['窗帘', '百叶窗'],
  ['床单', '被套'],
  ['耳机', '音箱'],
  ['充电器', '数据线'],
  ['地图', '导航'],
  ['相册', '日历'],
  ['包子', '馒头'],
  ['椅子', '沙发'],
  ['碗', '盘子'],
  ['筷子', '勺子'],
  ['玻璃杯', '马克杯'],
];

const RANDOM_NAMES = ['阿明', '小周', '小林', '阿杰', '小雨', '阿文', '小米', '阿哲', '小苏', '阿宁'];

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function shuffleIndices(length) {
  const items = Array.from({ length }, (_, index) => index);
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function normalizeConfig(raw) {
  return {
    playerCount: clampNumber(raw.playerCount, 3, 12, 4),
    showNickname: !!raw.showNickname,
    allowSkip: !!raw.allowSkip,
  };
}

function randomName(existingNames = []) {
  const base = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  let name = base;
  let attempt = 0;
  while (existingNames.includes(name) && attempt < 20) {
    name = `${base}${Math.floor(10 + Math.random() * 90)}`;
    attempt += 1;
  }
  return name;
}

function randomRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function clone(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

function ensureCreator(room) {
  if (!room.creatorPlayerId && room.players[0]) {
    room.creatorPlayerId = room.players[0].id;
  }
  return room.creatorPlayerId || '';
}

function ensureWordCycle(room) {
  if (!Array.isArray(room.wordOrder) || room.wordOrder.length !== WORD_POOLS.length) {
    room.wordOrder = shuffleIndices(WORD_POOLS.length);
    room.wordCursor = 0;
  }
  if (typeof room.wordCursor !== 'number' || room.wordCursor < 0) {
    room.wordCursor = 0;
  }
  if (room.wordCursor >= room.wordOrder.length) {
    room.wordOrder = shuffleIndices(WORD_POOLS.length);
    room.wordCursor = 0;
  }
}

function takeNextWordPair(room) {
  ensureWordCycle(room);
  const pair = WORD_POOLS[room.wordOrder[room.wordCursor]];
  room.wordCursor += 1;
  return {
    civilianWord: pair[0],
    spyWord: pair[1],
  };
}

function alivePlayers(room) {
  return room.players.filter((player) => player.alive);
}

function displayName(room, player) {
  return room.config.showNickname ? player.name : `玩家${player.seatNo}`;
}

function assignRoles(room) {
  if (!room.selectedWordPair) {
    room.selectedWordPair = takeNextWordPair(room);
  }
  const spyIndex = Math.floor(Math.random() * room.players.length);
  room.players.forEach((player, index) => {
    player.role = index === spyIndex ? 'spy' : 'civilian';
    player.alive = true;
    player.voted = false;
  });
  syncWordsToRoles(room);
}

function syncWordsToRoles(room) {
  if (!room.selectedWordPair) return;
  room.players.forEach((player) => {
    if (player.role === 'spy') {
      player.word = room.selectedWordPair.spyWord;
      return;
    }
    if (player.role === 'civilian') {
      player.word = room.selectedWordPair.civilianWord;
      return;
    }
    player.word = '';
  });
}

function startRound(room) {
  const alive = alivePlayers(room);
  room.status = 'speaking';
  room.currentSpeakerIndex = 0;
  room.currentSpeakerId = alive[0] ? alive[0].id : '';
  room.votes = {};
  room.updatedAt = Date.now();
}

function startVoting(room) {
  room.status = 'voting';
  room.votes = {};
  room.voteTally = [];
  room.topVotePlayerIds = [];
  room.pendingEliminationId = '';
  room.updatedAt = Date.now();
}

function buildVoteTally(room) {
  const counts = new Map();
  alivePlayers(room).forEach((player) => counts.set(player.id, 0));
  Object.values(room.votes).forEach((targetId) => {
    if (!targetId || !counts.has(targetId)) return;
    counts.set(targetId, counts.get(targetId) + 1);
  });
  const voteTally = alivePlayers(room)
    .map((player) => ({
      playerId: player.id,
      name: displayName(room, player),
      count: counts.get(player.id) || 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const maxCount = voteTally[0] ? voteTally[0].count : 0;
  const topVotePlayerIds = maxCount > 0
    ? voteTally.filter((item) => item.count === maxCount).map((item) => item.playerId)
    : alivePlayers(room).map((player) => player.id);
  room.voteTally = voteTally;
  room.topVotePlayerIds = topVotePlayerIds;
  room.pendingEliminationId = topVotePlayerIds[Math.floor(Math.random() * topVotePlayerIds.length)] || '';
}

function checkWinner(room) {
  const spyAlive = room.players.find((player) => player.role === 'spy' && player.alive);
  if (!spyAlive) return 'civilian';
  if (alivePlayers(room).length <= 2) return 'spy';
  return '';
}

function eliminateTopVoted(room) {
  buildVoteTally(room);
  const target = room.players.find((item) => item.id === room.pendingEliminationId && item.alive);
  if (!target) return;
  target.alive = false;
  room.eliminatedPlayerId = target.id;
  room.updatedAt = Date.now();
  const winner = checkWinner(room);
  if (winner) {
    room.winner = winner;
    room.status = 'finished';
    return;
  }
  room.roundNo += 1;
  startRound(room);
}

function buildRoomState(room, client) {
  const creatorPlayerId = ensureCreator(room);
  const players = room.players.map((player) => {
    const item = {
      id: player.id,
      seatNo: player.seatNo,
      name: displayName(room, player),
      alive: player.alive,
    };
    if (room.status === 'finished') {
      item.role = player.role;
      item.word = player.word;
    }
    return item;
  });
  const currentSpeaker = room.players.find((player) => player.id === room.currentSpeakerId) || null;
  const me = client && client.playerId
    ? room.players.find((player) => player.id === client.playerId) || null
    : null;
  const isCreator = !!(me && me.id === creatorPlayerId);
  const hasVoted = !!(me && Object.prototype.hasOwnProperty.call(room.votes, me.id));
  const myVote = hasVoted ? room.votes[me.id] : '';
  const canShowPair = room.status === 'finished';
  return {
    roomCode: room.roomCode,
    status: room.status,
    roundNo: room.roundNo,
    creatorPlayerId,
    isCreator,
    config: clone(room.config),
    selectedWordPair: canShowPair ? clone(room.selectedWordPair) : null,
    players,
    aliveCount: alivePlayers(room).length,
    voteTotal: alivePlayers(room).length,
    votedCount: Object.keys(room.votes).length,
    currentSpeakerId: room.currentSpeakerId,
    currentSpeakerName: currentSpeaker ? displayName(room, currentSpeaker) : '',
    currentSpeakerSeatNo: currentSpeaker ? currentSpeaker.seatNo : 0,
    voteTally: clone(room.voteTally),
    topVotePlayerIds: clone(room.topVotePlayerIds),
    pendingEliminationId: room.pendingEliminationId,
    eliminatedPlayerId: room.eliminatedPlayerId,
    eliminatedName: players.find((player) => player.id === room.eliminatedPlayerId)?.name || '',
    winner: room.winner,
    me: me
      ? {
          id: me.id,
          name: displayName(room, me),
          seatNo: me.seatNo,
          alive: me.alive,
          role: room.status === 'finished' ? me.role : undefined,
          word: ((room.status === 'speaking' || room.status === 'voting') && me.alive) || room.status === 'finished' ? me.word : '',
          hasVoted,
          canVote: room.status === 'voting' && me.alive && !hasVoted,
          votedTargetId: myVote,
        }
      : null,
    speakerOrder: alivePlayers(room).map((player) => ({
      id: player.id,
      name: displayName(room, player),
      alive: player.alive,
    })),
  };
}

function send(socket, data) {
  if (socket.destroyed) return;
  const payload = Buffer.from(JSON.stringify(data));
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  socket.write(Buffer.concat([header, payload]));
}

function decodeFrames(state, chunk) {
  state.buffer = Buffer.concat([state.buffer, chunk]);
  const messages = [];
  while (state.buffer.length >= 2) {
    const byte1 = state.buffer[0];
    const byte2 = state.buffer[1];
    const opcode = byte1 & 0x0f;
    const masked = (byte2 & 0x80) === 0x80;
    let payloadLength = byte2 & 0x7f;
    let offset = 2;
    if (payloadLength === 126) {
      if (state.buffer.length < 4) break;
      payloadLength = state.buffer.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      if (state.buffer.length < 10) break;
      payloadLength = Number(state.buffer.readBigUInt64BE(2));
      offset = 10;
    }
    const maskLength = masked ? 4 : 0;
    const frameLength = offset + maskLength + payloadLength;
    if (state.buffer.length < frameLength) break;
    const maskingKey = masked ? state.buffer.subarray(offset, offset + 4) : null;
    const payload = state.buffer.subarray(offset + maskLength, frameLength);
    const data = Buffer.from(payload);
    if (masked && maskingKey) {
      for (let i = 0; i < data.length; i += 1) {
        data[i] ^= maskingKey[i % 4];
      }
    }
    state.buffer = state.buffer.subarray(frameLength);
    if (opcode === 0x8) {
      state.closed = true;
      break;
    }
    if (opcode === 0x9) {
      messages.push({ type: 'ping' });
      continue;
    }
    if (opcode === 0x1) {
      messages.push({ type: 'text', data: data.toString('utf8') });
    }
  }
  return messages;
}

function broadcastRoom(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  for (const client of connections.values()) {
    if (client.roomCode !== roomCode) continue;
    send(client.socket, {
      type: 'event',
      event: 'room_state',
      payload: buildRoomState(room, client),
    });
  }
}

function sendError(socket, requestId, error) {
  send(socket, {
    type: 'response',
    requestId,
    ok: false,
    error,
  });
}

function sendSuccess(socket, requestId, payload) {
  send(socket, {
    type: 'response',
    requestId,
    ok: true,
    payload,
  });
}

function attachClient(socket) {
  const clientId = uid('client');
  const state = {
    socket,
    buffer: Buffer.alloc(0),
    clientId,
    roomCode: '',
    role: 'player',
    playerId: '',
    closed: false,
  };
  connections.set(clientId, state);
  socket.on('data', (chunk) => {
    if (state.closed) return;
    const frames = decodeFrames(state, chunk);
    frames.forEach((frame) => {
      if (frame.type === 'ping') {
        send(socket, { type: 'pong' });
        return;
      }
      if (frame.type !== 'text') return;
      let message;
      try {
        message = JSON.parse(frame.data);
      } catch (error) {
        return;
      }
      if (message.type !== 'request') return;
      handleRequest(state, message);
    });
    if (state.closed) {
      socket.end();
    }
  });
  socket.on('close', () => {
    state.closed = true;
    connections.delete(clientId);
  });
  socket.on('error', () => {
    state.closed = true;
    connections.delete(clientId);
  });
  send(socket, { type: 'event', event: 'welcome', payload: { clientId } });
}

function handleRequest(client, message) {
  const { requestId, action, payload = {} } = message;
  const socket = client.socket;
  try {
    if (action === 'create_room') {
      const roomCode = randomRoomCode();
      const playerNameInput = String(payload.playerName || '').trim();
      const config = normalizeConfig(payload.config || {});
      const playerName = playerNameInput || randomName();
      const firstPlayer = {
        id: uid('player'),
        name: playerName,
        seatNo: 1,
        alive: true,
        role: '',
        word: '',
        voted: false,
      };
      const room = {
        roomCode,
        creatorPlayerId: firstPlayer.id,
        config,
        players: [firstPlayer],
        status: 'lobby',
        roundNo: 1,
        currentSpeakerIndex: -1,
        currentSpeakerId: '',
        selectedWordPair: null,
        wordOrder: shuffleIndices(WORD_POOLS.length),
        wordCursor: 0,
        votes: {},
        voteTally: [],
        topVotePlayerIds: [],
        pendingEliminationId: '',
        eliminatedPlayerId: '',
        winner: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      room.selectedWordPair = takeNextWordPair(room);
      rooms.set(roomCode, room);
      client.roomCode = roomCode;
      client.role = 'player';
      client.playerId = firstPlayer.id;
      sendSuccess(socket, requestId, {
        room: buildRoomState(room, client),
        session: {
          roomCode,
          clientId: client.clientId,
          role: 'player',
          playerId: firstPlayer.id,
        },
      });
      broadcastRoom(roomCode);
      return;
    }

    if (action === 'join_room') {
      const roomCode = String(payload.roomCode || '').trim();
      const playerNameInput = String(payload.playerName || '').trim();
      const room = getRoom(roomCode);
      if (!room) {
        sendError(socket, requestId, '房间不存在');
        return;
      }
      if (room.status !== 'lobby') {
        sendError(socket, requestId, '房间已开始');
        return;
      }
      if (room.players.length >= room.config.playerCount) {
        sendError(socket, requestId, '房间已满');
        return;
      }
      const seatNo = room.players.length + 1;
      const occupiedNames = room.players.map((item) => item.name);
      const finalName = room.config.showNickname ? (playerNameInput || randomName(occupiedNames)) : `玩家${seatNo}`;
      const player = {
        id: uid('player'),
        name: finalName,
        seatNo,
        alive: true,
        role: '',
        word: '',
        voted: false,
      };
      room.players.push(player);
      room.updatedAt = Date.now();
      client.roomCode = roomCode;
      client.role = 'player';
      client.playerId = player.id;
      sendSuccess(socket, requestId, {
        room: buildRoomState(room, client),
        session: {
          roomCode,
          clientId: client.clientId,
          role: 'player',
          playerId: player.id,
        },
      });
      broadcastRoom(roomCode);
      return;
    }

    if (action === 'resume_session') {
      const roomCode = String(payload.roomCode || '').trim();
      const room = getRoom(roomCode);
      if (!room) {
        sendError(socket, requestId, '房间不存在');
        return;
      }
      const player = room.players.find((item) => item.id === payload.playerId);
      if (!player) {
        sendError(socket, requestId, '会话失效');
        return;
      }
      client.roomCode = roomCode;
      client.role = 'player';
      client.clientId = String(payload.clientId || client.clientId || '');
      client.playerId = player.id;
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(roomCode);
      return;
    }

    const room = client.roomCode ? getRoom(client.roomCode) : null;
    if (!room) {
      sendError(socket, requestId, '请先加入房间');
      return;
    }

    if (action === 'get_room') {
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      return;
    }

    if (action === 'reroll_words') {
      const creatorPlayerId = ensureCreator(room);
      if (client.playerId !== creatorPlayerId) {
        sendError(socket, requestId, '只有创建房间的玩家可以换词');
        return;
      }
      if (room.status !== 'speaking') {
        sendError(socket, requestId, '开局后才能换词');
        return;
      }
      room.selectedWordPair = takeNextWordPair(room);
      syncWordsToRoles(room);
      room.updatedAt = Date.now();
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(room.roomCode);
      return;
    }

    if (action === 'start_game') {
      if (room.players.length < 3) {
        sendError(socket, requestId, '至少需要 3 名玩家');
        return;
      }
      const creatorPlayerId = ensureCreator(room);
      if (client.playerId !== creatorPlayerId) {
        sendError(socket, requestId, '只有创建房间的玩家可以开始游戏');
        return;
      }
      if (!room.selectedWordPair) {
        room.selectedWordPair = takeNextWordPair(room);
      }
      assignRoles(room);
      room.roundNo = 1;
      room.winner = '';
      room.eliminatedPlayerId = '';
      room.voteTally = [];
      room.topVotePlayerIds = [];
      room.pendingEliminationId = '';
      room.votes = {};
      startRound(room);
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(room.roomCode);
      return;
    }

    if (action === 'next_speaker') {
      if (room.status !== 'speaking') {
        sendError(socket, requestId, '当前不是发言阶段');
        return;
      }
      const currentPlayer = room.players.find((player) => player.id === client.playerId);
      const currentSpeaker = room.players.find((player) => player.id === room.currentSpeakerId);
      if (!currentPlayer || !currentSpeaker || currentPlayer.seatNo !== currentSpeaker.seatNo) {
        sendError(socket, requestId, '只有当前发言玩家可以切换下一位');
        return;
      }
      const alive = alivePlayers(room);
      const nextIndex = room.currentSpeakerIndex + 1;
      if (nextIndex >= alive.length) {
        startVoting(room);
      } else {
        room.currentSpeakerIndex = nextIndex;
        room.currentSpeakerId = alive[nextIndex].id;
        room.updatedAt = Date.now();
      }
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(room.roomCode);
      return;
    }

    if (action === 'submit_vote') {
      if (room.status !== 'voting') {
        sendError(socket, requestId, '当前不能投票');
        return;
      }
      const player = room.players.find((item) => item.id === client.playerId);
      if (!player || !player.alive) {
        sendError(socket, requestId, '你已出局');
        return;
      }
      if (Object.prototype.hasOwnProperty.call(room.votes, player.id)) {
        sendError(socket, requestId, '你已经投过票了');
        return;
      }
      const targetId = String(payload.targetId || '');
      if (!targetId && !room.config.allowSkip) {
        sendError(socket, requestId, '不允许弃票');
        return;
      }
      if (targetId && !room.players.find((item) => item.id === targetId && item.alive)) {
        sendError(socket, requestId, '投票对象无效');
        return;
      }
      room.votes[player.id] = targetId;
      player.voted = true;
      const alive = alivePlayers(room);
      const hasAllVotes = alive.every((item) => Object.prototype.hasOwnProperty.call(room.votes, item.id));
      room.updatedAt = Date.now();
      if (hasAllVotes) {
        eliminateTopVoted(room);
      }
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(room.roomCode);
      return;
    }

    if (action === 'restart_game') {
      room.status = 'lobby';
      room.roundNo = 1;
      room.currentSpeakerIndex = -1;
      room.currentSpeakerId = '';
      room.selectedWordPair = takeNextWordPair(room);
      room.votes = {};
      room.voteTally = [];
      room.topVotePlayerIds = [];
      room.pendingEliminationId = '';
      room.eliminatedPlayerId = '';
      room.winner = '';
      room.players.forEach((player) => {
        player.alive = true;
        player.role = '';
        player.word = '';
        player.voted = false;
      });
      room.updatedAt = Date.now();
      sendSuccess(socket, requestId, { room: buildRoomState(room, client) });
      broadcastRoom(room.roomCode);
      return;
    }

    sendError(socket, requestId, '未知操作');
  } catch (error) {
    sendError(socket, requestId, error.message || '服务端异常');
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));
  attachClient(socket);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WhoIsSpy server listening on ws://0.0.0.0:${PORT}`);
});
