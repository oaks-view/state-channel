const EthCrypto = require('eth-crypto');

/**
 * Transaction Object showing current transfer detail
 * @typedef {Object} Tx
 * @property {Number} value - number of tokens to transfer
 * @property {String} from - ethereum address.
 * @property {String} to - ethereum address
 */

/**
 * ChannelReceipt properties.
 * @typedef {Object} ChannelReceipt
 * @property {Tx} tx - current transaction
 * @property {String} participant1 - ethereum address.
 * @property {String} participant2 - ethereum address
 * @property {Number} nonce - Indicates receipt order. Used to identify the most recent receipt
 * @property {Number} participant1Bal - token balance for `participant1`
 * @property {Number} participant2Bal - token balance for `participant2`
 * @property {String} participant1Message - message hash gotten from signing the txObject using participant1 private key
 * @property {String} participant2Message - message hash gotten from signing the txObject using participant2 private key
 * @property {String} participant1Signature - digital signature gotten from signing with participant1 private key
 * @property {String} participant2Signature - digital signature gotten from signing with participant2 private key
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

/**
 *
 * @param {ChannelReceipt} channelReceipt
 * @param {string} address
 */
function getBalanceFromReceipt(channelReceipt, address) {
  if (channelReceipt.participant1 === address) {
    return channelReceipt.participant1Bal;
  } else if (channelReceipt.participant2 === address) {
    return channelReceipt.participant2Bal;
  }

  return null;
}

/**
 *
 * @param {{
 * value: Number,
 * address: string,
 * privateKey: string,
 * targetAddress: string,
 * oldReceipt: ChannelReceipt,
 * addressCurrentBalance?: Number,
 * targetAddressCurrentBalance?: Number
 * }} param - payload
 * @returns {ChannelReceipt}
 */
function createStateChannelReceipt({
  value,
  address,
  privateKey,
  targetAddress,
  oldReceipt = null,
  addressCurrentBalance = null,
  targetAddressCurrentBalance = null,
}) {
  const tx = {
    value,
    from: address,
    to: targetAddress,
  };

  if (
    !!oldReceipt &&
    (!oldReceipt.participant1Message ||
      !oldReceipt.participant1Signature ||
      !oldReceipt.participant1Message ||
      !oldReceipt.participant2Signature) 
  ) throw new Error('Old Receipt is invalid, missing authorised signature');

    const isParticipant1 = !oldReceipt ? true : oldReceipt.participant1 === address;
  const fromBalance = !oldReceipt ? addressCurrentBalance : getBalanceFromReceipt(oldReceipt, address);
  const targetBalance = !oldReceipt ? targetAddressCurrentBalance : getBalanceFromReceipt(oldReceipt, targetAddress);

  const balances = [fromBalance, targetBalance];

  if (balances.includes(null) || balances.includes(undefined)) throw new Error('No value supplied for address balances');

  if (fromBalance < value) throw new Error('Insufficient balance');

  const fromBalanceNew = fromBalance - value;
  const targetBalanceNew = targetBalance + value;

  const participant1Bal = isParticipant1 ? fromBalanceNew : targetBalanceNew;
  const participant2Bal = !isParticipant1 ? fromBalanceNew : targetBalanceNew;

  const participant1 = isParticipant1 ? address : targetAddress;
  const participant2 = !isParticipant1 ? address : targetAddress;

  const digitalStamp = createSignature({
    participant1,
    participant2,
    participant1Bal,
    participant2Bal,
    privateKey,
  });

  return {
    tx,
    participant1Bal,
    participant2Bal,
    nonce: !oldReceipt ? 0 : oldReceipt.nonce + 1,
    participant1,
    participant2,
    ...(isParticipant1
      ? {
          participant1Message: digitalStamp.message,
          participant1Signature: digitalStamp.signature,
        }
      : {
          participant2Message: digitalStamp.message,
          participant2Signature: digitalStamp.signature,
        }),
  };
}

/**
 *
 * @param {ChannelReceipt} receipt
 * @param {string} address
 * @param {string} privateKey
 * @returns {ChannelReceipt}
 */
function approveStateChannelReceipt(receipt, address, privateKey) {
  const isParticipant1 = receipt.participant1 === address;

  const digitalStamp = createSignature({
    participant1: receipt.participant1,
    participant2: receipt.participant2,
    participant1Bal: receipt.participant1Bal,
    participant2Bal: receipt.participant2Bal,
    privateKey,
  });

  return {
    ...receipt,
    ...(isParticipant1
      ? {
          participant1Message: digitalStamp.message,
          participant1Signature: digitalStamp.signature,
        }
      : {
          participant2Message: digitalStamp.message,
          participant2Signature: digitalStamp.signature,
        }),
  };
}

module.exports = {
  createStateChannelReceipt,
  approveStateChannelReceipt,
  createSignature,
};
