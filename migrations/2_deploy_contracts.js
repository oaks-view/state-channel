const SimpleERC20Token = artifacts.require("./SimpleERC20Token.sol");
const dotenv = require("dotenv");
dotenv.config();

const intialSupply = +process.env.INITIAL_SUPPLY || 2000000;

module.exports = function (deployer) {
  deployer.deploy(SimpleERC20Token, intialSupply);
};
