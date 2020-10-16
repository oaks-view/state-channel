# state-channel

Demonstrate the idea of state channels as a scalability option for ethereum blockchain.

**Pre-Requisites**

1. [NodeJS](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04)
2. [Yarn](https://stackoverflow.com/questions/42606941/install-yarn-ubuntu-16-04-linux-mint-18-1)
3. [GanacheCLI](https://github.com/trufflesuite/ganache-cli)
4. [Truffle](https://github.com/trufflesuite/truffle)

**Setup && Installation**

1. Clone the repo

```
git clone https://github.com/oaks-view/state-channel.git

```

2. All needed dependencies are included in package.json. So the following install command should be executed just once
   in the root directory of the project.

```
npm install
```

or if you prefer yarn

```
yarn install
```

# Testing the state channel.

Unit tests are provided to examine the state channel end to end. To run the tests please do the following

1. `Start Ganache:` From the root directory, execute the folowing command

```
npm run ganache
```

This will start and configure the preinstalled `ganache-cli` required for the unit tests to work.

2. `Run tests:` Open a new terminal in the root directory

```
npm test
```

This will run the tests against the already running `ganache-cli`.
All test cases can be found within the `test/SimpleERC20Token.sol.test.js` file.
