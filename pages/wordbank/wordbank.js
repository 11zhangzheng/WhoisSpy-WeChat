const storage = require('../../utils/storage');

function createBank() {
  return {
    id: '',
    name: '',
    civilianWord: '',
    spyWord: '',
    isDefault: false,
    updatedAt: Date.now(),
  };
}

Page({
  data: {
    wordBanks: [],
    editing: null,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      wordBanks: storage.getWordBanks(),
      editing: null,
    });
  },

  onAdd() {
    this.setData({
      editing: createBank(),
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const bank = storage.getWordBanks().find((item) => item.id === id);
    if (!bank) return;
    this.setData({
      editing: { ...bank },
    });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const banks = storage.getWordBanks();
    const target = banks.find((item) => item.id === id);
    if (!target) return;
    wx.showModal({
      title: '删除词库',
      content: `确认删除「${target.name}」吗？`,
      success: (res) => {
        if (!res.confirm) return;
        const nextBanks = banks.filter((item) => item.id !== id);
        if (nextBanks.length === 0) {
          wx.showToast({
            title: '至少保留一个词库',
            icon: 'none',
          });
          return;
        }
        if (target.isDefault) {
          nextBanks[0].isDefault = true;
        }
        storage.saveWordBanks(nextBanks);
        this.refresh();
      },
    });
  },

  onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    const banks = storage.getWordBanks().map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    storage.saveWordBanks(banks);
    this.refresh();
  },

  onNameInput(e) {
    this.setData({
      'editing.name': e.detail.value,
    });
  },

  onNameChange(e) {
    this.setData({
      'editing.name': e.detail.value,
    });
  },

  onCivilianInput(e) {
    this.setData({
      'editing.civilianWord': e.detail.value,
    });
  },

  onCivilianChange(e) {
    this.setData({
      'editing.civilianWord': e.detail.value,
    });
  },

  onSpyInput(e) {
    this.setData({
      'editing.spyWord': e.detail.value,
    });
  },

  onSpyChange(e) {
    this.setData({
      'editing.spyWord': e.detail.value,
    });
  },

  onDefaultToggle(e) {
    this.setData({
      'editing.isDefault': e.detail.value,
    });
  },

  onCancel() {
    this.setData({
      editing: null,
    });
  },

  onSave() {
    const editing = this.data.editing;
    if (!editing) return;
    const name = String(editing.name || '').trim();
    const civilianWord = String(editing.civilianWord || '').trim();
    const spyWord = String(editing.spyWord || '').trim();
    if (!name || !civilianWord || !spyWord) {
      wx.showToast({
        title: '请填写完整',
        icon: 'none',
      });
      return;
    }
    if (civilianWord === spyWord) {
      wx.showToast({
        title: '词条不能相同',
        icon: 'none',
      });
      return;
    }
    const banks = storage.getWordBanks();
    const now = Date.now();
    let nextBanks;
    if (editing.id) {
      nextBanks = banks.map((item) =>
        item.id === editing.id
          ? {
              ...item,
              name,
              civilianWord,
              spyWord,
              isDefault: !!editing.isDefault,
              updatedAt: now,
            }
          : {
              ...item,
              isDefault: editing.isDefault ? false : item.isDefault,
            }
      );
    } else {
      nextBanks = [
        ...banks.map((item) => ({
          ...item,
          isDefault: editing.isDefault ? false : item.isDefault,
        })),
        {
          id: `bank_${now}_${Math.random().toString(16).slice(2, 6)}`,
          name,
          civilianWord,
          spyWord,
          isDefault: !!editing.isDefault,
          updatedAt: now,
        },
      ];
    }
    if (!nextBanks.some((item) => item.isDefault)) {
      nextBanks[0].isDefault = true;
    }
    storage.saveWordBanks(nextBanks);
    this.refresh();
  },
});
