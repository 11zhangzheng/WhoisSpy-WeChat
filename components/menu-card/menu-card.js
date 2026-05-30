Component({
  properties: {
    icon: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: 'green' // green, blue, orange, gray
    },
    badge: {
      type: String,
      value: ''
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap');
    }
  }
});
