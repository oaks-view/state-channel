const SimpleERC20Token = artifacts.require("SimpleERC20Token");

contract("SimpleERC20Token", (accounts) => {
  const owner = accounts[0];
  const account1 = accounts[1];
  const account2 = accounts[2];

  const initialSupply = +process.env.INITIAL_SUPPLY;

  it("should set initial balance of contract owner on initialization", async () => {
    const tokenInstance = await SimpleERC20Token.deployed();

    const totalSupply = await tokenInstance.totalSupply();
    const ownerBalance = await tokenInstance.balanceOf(owner);

    assert.equal(Number(totalSupply), initialSupply);
    assert.equal(Number(ownerBalance), totalSupply);
  });

  it("can get the amount transferable from one account to the other", async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const totalSupply = await tokenInstance.totalSupply();
    const ownerBalance = await tokenInstance.balanceOf(owner);

    assert.equal(Number(totalSupply), initialSupply);
    assert.equal(Number(ownerBalance), totalSupply);

    const transferableAmount = 4500;

    await tokenInstance.approve(account1, transferableAmount);

    const allowance = await tokenInstance.allowance(owner, account1);
    assert.equal(Number(allowance), Number(transferableAmount));
  });

  it("can transfer from one account to the another if approved by owner", async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const totalSupply = Number(await tokenInstance.totalSupply());
    let ownerBalance = Number(await tokenInstance.balanceOf(owner));

    assert.equal(totalSupply, initialSupply);
    assert.equal(ownerBalance, totalSupply);

    const transferableAmount = 4500;

    await tokenInstance.approve(account1, transferableAmount);

    const allowance = Number(await tokenInstance.allowance(owner, account1));
    assert.equal(allowance, transferableAmount);

    const transferAmount = 3000;

    await tokenInstance.transferFrom(owner, account2, transferAmount, {
      from: account1,
    });

    const acc2Balance = Number(await tokenInstance.balanceOf(account2));
    ownerBalance = Number(await tokenInstance.balanceOf(owner));

    assert.equal(ownerBalance, totalSupply - transferAmount);
    assert.equal(acc2Balance, transferAmount);
  });

  it("can transfer to other accounts", async () => {
    const tokenInstance = await SimpleERC20Token.new(initialSupply);

    const totalSupply = Number(await tokenInstance.totalSupply());
    let ownerBalance = Number(await tokenInstance.balanceOf(owner));
    let acc2Balance = Number(await tokenInstance.balanceOf(account2));

    assert.equal(totalSupply, initialSupply);
    assert.equal(ownerBalance, totalSupply);

    const transferAmount = 8000;

    await tokenInstance.transfer(account2, transferAmount);
    ownerBalance = Number(await tokenInstance.balanceOf(owner));
    acc2Balance = Number(await tokenInstance.balanceOf(account2));

    assert.equal(ownerBalance, totalSupply - transferAmount);
    assert.equal(acc2Balance, transferAmount);
  });
});
