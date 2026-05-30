Component({
  properties: {
    players: {
      type: Array,
      value: []
    },
    currentSpeakerId: {
      type: String,
      value: ''
    },
    selectedIds: {
      type: Array,
      value: []
    },
    showSeatNo: {
      type: Boolean,
      value: true
    },
    showRoles: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onPlayerTap(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('select', { id });
    }
  }
});
