const http = require('http');
const { createApp } = require('./createApp');

function createServer() {
  const { app, config } = createApp();
  const server = http.createServer(app);

  return { server, app, config };
}

module.exports = { createServer };
