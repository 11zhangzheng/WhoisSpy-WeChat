Component({
  properties: {
    text: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'primary' // primary, secondary, danger, ghost
    },
    block: {
      type: Boolean,
      value: false
    },
    loading: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onTap() {
      if (!this.data.disabled && !this.data.loading) {
        this.triggerEvent('tap');
      }
    }
  }
});
