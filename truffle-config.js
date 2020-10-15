require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: process.env.GANACHE_HOST,
      port: process.env.GANACHE_PORT,
      network_id: '*'
    }
  },
  compilers: {
    solc: {
      version: '0.5.11'
    }
  },
}
