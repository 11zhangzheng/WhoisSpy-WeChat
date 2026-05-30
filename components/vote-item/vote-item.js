Component({
  properties: {
    player: {
      type: Object,
      value: {}
    },
    selected: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onSelect() {
      this.triggerEvent('select', { id: this.data.player.id });
    }
  }
});
