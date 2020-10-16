const SimpleERC20Token = artifacts.require('SimpleERC20Token');
const EthCrypto = require('eth-crypto');
const fs = require('fs');

const ganacheKeys = JSON.parse(fs.readFileSync('./ganache-keys.json'));
const addressPrivateKeyPairs = ganacheKeys.private_keys;
const addresses = Object.keys(addressPrivateKeyPairs);

contract('SimpleERC20Token', (accounts) => {
  const ownerAccount = {
    address: addresses[0],
    privateKey: addressPrivateKeyPairs[addresses[0]],
  };

  const participantAccount1 = {
    address: addresses[1],
    privateKey: addressPrivateKeyPairs[addresses[1]],
  };

  const participantAccount2 = {
    address: addresses[2],
    privateKey: addressPrivateKeyPairs[addresses[2]],
  };

  const owner = accounts[0];
  const account1 = accounts[1];
  const account2 = accounts[2];

  const initialSupply = +process.env.INITIAL_SUPPLY;

  it('should set initial balance of contract owner on initialization', async () => {
    const tokenInstance = await SimpleERC20Token.deployed();

    const totalSupply = await tokenInstance.totalSupply();
    const ownerBalance = await tokenInstance.balanceOf(ownerAccount.address);

    assert.equal(Number(totalSupply), initialSupply);
    assert.equal(Number(ownerBalance), totalSupply);
  });

  it('can get the amount transferable from one account to the other', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const transferableAmount = 4500;

    await tokenInstance.approve(participantAccount1.address, transferableAmount);

    const allowance = await tokenInstance.allowance(ownerAccount.address, participantAccount1.address);
    assert.equal(Number(allowance), Number(transferableAmount));
  });

  it('can transfer from one account to the another if approved by owner', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const transferableAmount = 4500;

    await tokenInstance.approve(participantAccount1.address, transferableAmount);

    const allowance = Number(await tokenInstance.allowance(ownerAccount.address, participantAccount1.address));
    assert.equal(allowance, transferableAmount);

    const transferAmount = 3000;

    await tokenInstance.transferFrom(ownerAccount.address, participantAccount2.address, transferAmount, {
      from: participantAccount1.address,
    });

    const acc2Balance = Number(await tokenInstance.balanceOf(participantAccount2.address));
    ownerBalance = Number(await tokenInstance.balanceOf(ownerAccount.address));

    assert.equal(ownerBalance, initialSupply - transferAmount);
    assert.equal(acc2Balance, transferAmount);
  });

  it('can transfer to other accounts', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const transferAmount = 8000;

    await tokenInstance.transfer(participantAccount1.address, transferAmount);
    ownerBalance = Number(await tokenInstance.balanceOf(ownerAccount.address));
    acc2Balance = Number(await tokenInstance.balanceOf(participantAccount1.address));

    assert.equal(ownerBalance, initialSupply - transferAmount);
    assert.equal(acc2Balance, transferAmount);
  });

  // todo add test case for splitSignature(bytes memory sig)

  it('can get address from signature', async () => {
    const payload = {
      value: 'Hello world',
      privateKey: ownerAccount.privateKey,
    };

    const result = createSignature(payload);

    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    const signerAddress = await tokenInstance.recoverSigner(result.message, result.signature);

    assert.equal(signerAddress.toLocaleLowerCase(), ownerAccount.address.toLocaleLowerCase());
  });

  it('rejects state channel receipts if not signed by both parties', async () => {
    // A starts tries to transfer to B
    // A creates new channel receipt
    // A signs Channel Receipt
    // A sends Channel receipt to contract to complete
  });

  it('accepts state channel receipts if it is signed by both parties', async () => {
    // A starts tries to transfer to B
    // A creates new channel receipt
    // A signs Channel Receipt
    // A sends Channel Receipt TO B
    // B signs Channel Receipt
  });
});

/*
[
  { type: "uint256", value: "5" },
  { type: "string", value: "Banana" }
]

 */

function createSignature({ value, privateKey }) {
  //   const signerIdentity = EthCrypto.createIdentity();
  const message = EthCrypto.hash.keccak256([{ type: 'string', value }]);

  //   const signature = EthCrypto.sign(signerIdentity.privateKey, message);
  const signature = EthCrypto.sign(privateKey, message);

  return {
    message,
    signature,
  };
}
