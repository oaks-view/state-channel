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

  it('can get signer address from signature', async () => {
    const result = createSignature({
      participant1Bal: 4000,
      participant2Bal: 5000,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount1.privateKey,
    });

    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    const signerAddress = await tokenInstance.recoverSigner(result.message, result.signature);

    assert.equal(signerAddress.toLocaleLowerCase(), participantAccount1.address.toLocaleLowerCase());
  });

  it('rejects update if sender is not a participant', async () => {
    const payload1 = {
      value: 'Hello world',
      privateKey: participantAccount1.privateKey,
    };

    const payload2 = {
      value: 'Hello world',
      privateKey: participantAccount2.privateKey,
    };

    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    // transfer tokens to participant1
    const transferAmount = 9000;
    await tokenInstance.transfer(participantAccount1.address, transferAmount);

    const participant1BalUpdate = transferAmount / 2;
    const participant2BalUpdate = transferAmount / 2;

    // creating messages and signatures
    const result1 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount1.privateKey,
    });
    const result2 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount2.privateKey,
    });

    try {
      await tokenInstance.persistState(
        participantAccount1.address,
        participantAccount2.address,
        participant1BalUpdate,
        participant2BalUpdate,
        result1.message,
        result2.message,
        result1.signature,
        result2.signature,
        {
          from: participantAccount1.address,
        },
      );
    } catch (err) {
      const participant1Balance = await tokenInstance.balanceOf(participantAccount1.address);
      assert.equal(participant1Balance, transferAmount);
    }
  });

  it('rejects update if sum of new balances do not equal to sum of old balances', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    // transfer tokens to participant1
    const transferAmount = 9000;
    await tokenInstance.transfer(participantAccount1.address, transferAmount);

    const participant1BalUpdate = transferAmount * 2;
    const participant2BalUpdate = transferAmount * 2;

    // creating messages and signatures
    const result1 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount1.privateKey,
    });
    const result2 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount2.privateKey,
    });

    try {
      await tokenInstance.persistState(
        participantAccount1.address,
        participantAccount2.address,
        participant1BalUpdate,
        participant2BalUpdate,
        result1.message,
        result2.message,
        result1.signature,
        result2.signature,
      );
    } catch (err) {
      const participant1Balance = await tokenInstance.balanceOf(participantAccount1.address);
      assert.equal(participant1Balance, transferAmount);
    }
  });

  it('rejects update if recovered signer address does not match participant', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    // transfer tokens to participant1
    await tokenInstance.transfer(participantAccount1.address, initialSupply);

    const participant1BalUpdate = initialSupply / 2;
    const participant2BalUpdate = initialSupply / 2;

    // creating messages and signatures
    const result1 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount1.privateKey,
    });
    const result2 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount2.privateKey,
    });

    try {
      await tokenInstance.persistState(
        ownerAccount.address,
        participantAccount2.address,
        participant1BalUpdate,
        participant2BalUpdate,
        result1.message,
        result2.message,
        result1.signature,
        result2.signature,
        {
          from: participantAccount2.address,
        },
      );
    } catch (err) {}

    const participant1Balance = await tokenInstance.balanceOf(participantAccount1.address);
    assert.equal(participant1Balance, initialSupply);
  });

  it('successfully updates balances of participants', async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply, { from: ownerAccount.address });

    // transfer tokens to participant1
    await tokenInstance.transfer(participantAccount1.address, initialSupply);

    const participant1BalUpdate = initialSupply / 2;
    const participant2BalUpdate = initialSupply / 2;

    // creating messages and signatures
    const result1 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount1.privateKey,
    });
    const result2 = createSignature({
      participant1Bal: participant1BalUpdate,
      participant2Bal: participant2BalUpdate,
      participant1: participantAccount1.address,
      participant2: participantAccount2.address,
      privateKey: participantAccount2.privateKey,
    });

    await tokenInstance.persistState(
      participantAccount1.address,
      participantAccount2.address,
      participant1BalUpdate,
      participant2BalUpdate,
      result1.message,
      result2.message,
      result1.signature,
      result2.signature,
      {
        from: participantAccount2.address,
      },
    );

    const participant1Balance = await tokenInstance.balanceOf(participantAccount1.address);
    const participant2Balance = await tokenInstance.balanceOf(participantAccount2.address);
    assert.equal(Number(participant1Balance), participant1BalUpdate);
    assert.equal(Number(participant2Balance), participant2BalUpdate);
  });
});

/*
[
  { type: "uint256", value: "5" },
  { type: "string", value: "Banana" }
]

 */

function createSignature({ participant1Bal, participant2Bal, participant1, participant2, privateKey }) {
  const message = EthCrypto.hash.keccak256([
    { type: 'uint', value: participant1Bal },
    { type: 'uint', value: participant2Bal },
    { type: 'address', value: participant1 },
    { type: 'address', value: participant2 },
  ]);

  const signature = EthCrypto.sign(privateKey, message);

  return {
    message,
    signature,
  };
}
