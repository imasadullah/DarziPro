console.log('main start');
const { app } = require('electron');
console.log('electron loaded');

app.whenReady().then(() => {
  console.log('app ready, loading sqlite3');
  require('sqlite3');
  console.log('sqlite3 loaded');
  app.quit();
});
