Component({
  properties: {
    label: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'input' // input, textarea, stepper, toggle, picker
    },
    placeholder: {
      type: String,
      value: ''
    },
    value: {
      type: null,
      value: ''
    },
    min: {
      type: Number,
      value: 1
    },
    max: {
      type: Number,
      value: 99
    },
    hint: {
      type: String,
      value: ''
    }
  },

  data: {
    focus: false
  },

  methods: {
    onInput(e) {
      this.triggerEvent('change', { value: e.detail.value });
    },

    onFocus() {
      this.setData({ focus: true });
    },

    onBlur() {
      this.setData({ focus: false });
    },

    onMinus() {
      const newValue = this.data.value - 1;
      if (newValue >= this.data.min) {
        this.triggerEvent('change', { value: newValue });
      }
    },

    onPlus() {
      const newValue = this.data.value + 1;
      if (newValue <= this.data.max) {
        this.triggerEvent('change', { value: newValue });
      }
    },

    onToggle(e) {
      this.triggerEvent('change', { value: e.detail.value });
    },

    onPickerTap() {
      this.triggerEvent('tap');
    }
  }
});
