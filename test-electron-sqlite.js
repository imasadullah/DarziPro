const { app } = require('electron');

app.whenReady().then(async () => {
  console.log('Loading sqlite3...');
  require('sqlite3');
  console.log('sqlite3 loaded');
  app.quit();
});
