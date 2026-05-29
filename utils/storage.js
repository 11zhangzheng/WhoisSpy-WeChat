const WORD_BANKS_KEY = 'whois_spy_word_banks';
const LAST_CONFIG_KEY = 'whois_spy_last_config';
const CURRENT_GAME_KEY = 'whois_spy_current_game';
const SERVER_URL_KEY = 'whois_spy_server_url';
const SESSION_KEY = 'whois_spy_session';

const defaultWordBanks = [
  {
    id: 'bank_school',
    name: '校园日常',
    civilianWord: '老师',
    spyWord: '班主任',
    isDefault: true,
    updatedAt: Date.now(),
  },
  {
    id: 'bank_food',
    name: '餐桌场景',
    civilianWord: '可乐',
    spyWord: '雪碧',
    isDefault: false,
    updatedAt: Date.now(),
  },
  {
    id: 'bank_travel',
    name: '出行交通',
    civilianWord: '地铁',
    spyWord: '公交',
    isDefault: false,
    updatedAt: Date.now(),
  },
  {
    id: 'bank_game',
    name: '游戏娱乐',
    civilianWord: '王者荣耀',
    spyWord: '英雄联盟',
    isDefault: false,
    updatedAt: Date.now(),
  },
];

function read(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value === '' || value === undefined ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function write(key, value) {
  wx.setStorageSync(key, value);
}

function remove(key) {
  try {
    wx.removeStorageSync(key);
  } catch (error) {}
}

function ensureDefaults() {
  const banks = read(WORD_BANKS_KEY, null);
  if (!Array.isArray(banks) || banks.length === 0) {
    write(WORD_BANKS_KEY, defaultWordBanks);
  } else if (!banks.some((item) => item && item.isDefault)) {
    banks[0].isDefault = true;
    write(WORD_BANKS_KEY, banks);
  }
}

function getWordBanks() {
  ensureDefaults();
  const banks = read(WORD_BANKS_KEY, []);
  return Array.isArray(banks) ? banks : [];
}

function saveWordBanks(banks) {
  write(WORD_BANKS_KEY, banks);
}

function getDefaultWordBank() {
  const banks = getWordBanks();
  return banks.find((item) => item.isDefault) || banks[0] || null;
}

function getLastConfig() {
  return read(LAST_CONFIG_KEY, null);
}

function saveLastConfig(config) {
  write(LAST_CONFIG_KEY, config);
}

function getCurrentGame() {
  return read(CURRENT_GAME_KEY, null);
}

function saveCurrentGame(game) {
  write(CURRENT_GAME_KEY, game);
}

function clearCurrentGame() {
  remove(CURRENT_GAME_KEY);
}

function getServerUrl() {
  return read(SERVER_URL_KEY, 'ws://127.0.0.1:3001');
}

function saveServerUrl(url) {
  write(SERVER_URL_KEY, url);
}

function getSession() {
  return read(SESSION_KEY, null);
}

function saveSession(session) {
  write(SESSION_KEY, session);
}

function clearSession() {
  remove(SESSION_KEY);
}

module.exports = {
  WORD_BANKS_KEY,
  LAST_CONFIG_KEY,
  CURRENT_GAME_KEY,
  SERVER_URL_KEY,
  SESSION_KEY,
  defaultWordBanks,
  ensureDefaults,
  getWordBanks,
  saveWordBanks,
  getDefaultWordBank,
  getLastConfig,
  saveLastConfig,
  getCurrentGame,
  saveCurrentGame,
  clearCurrentGame,
  getServerUrl,
  saveServerUrl,
  getSession,
  saveSession,
  clearSession,
};
