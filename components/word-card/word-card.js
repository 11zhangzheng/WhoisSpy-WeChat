Component({
  properties: {
    word: {
      type: String,
      value: ''
    },
    role: {
      type: String,
      value: 'civilian' // civilian, spy
    },
    showRefresh: {
      type: Boolean,
      value: false
    },
    hint: {
      type: String,
      value: ''
    }
  },

  methods: {
    onRefresh() {
      this.triggerEvent('refresh');
    }
  }
});
