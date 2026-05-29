const storage = require('./utils/storage');

App({
  onLaunch() {
    storage.ensureDefaults();
  },
});
