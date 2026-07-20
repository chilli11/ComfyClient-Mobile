const { createServer } = require('./app/createServer');

const { server, config } = createServer();

server.listen(config.port, () => {
  console.log(`ComfyClient API listening on port ${config.port}`);
});
