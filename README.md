# state-channel
Demonstrate the idea of state channels as a scalability option for ethereum blockchain.

**Pre-Requisites**
1. [NodeJS](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04)
2. [Yarn](https://stackoverflow.com/questions/42606941/install-yarn-ubuntu-16-04-linux-mint-18-1)
3. [GanacheCLI](https://github.com/trufflesuite/ganache-cli)
4. [Truffle](https://github.com/trufflesuite/truffle)

**Installation**
1. Install Truffle and Ganache CLI globally. If you prefer, the graphical version of Ganache works as well!
```
npm install -g truffle
npm install -g ganache-cli
```

2. Clone the repo

```
git clone https://github.com/oaks-view/state-channel.git

```

3. Install all the node modules required by running:
```javascript
// install all the node modules using npm
npm install
```  
or if you  prefer yarn
```javascript
//install all the node modules using yarn
yarn install
```
4. Start truffle development console using
```
truffle develop
```
5. Inside the truffle console run `compile` to compile the contracts
6. You can see that a new `/build` folder has been created in the root directory which contains the compiled contracts.

7. Now these contracts need to be deployed on the Blockchain. For this, run `migrate` inside the truffle development console

