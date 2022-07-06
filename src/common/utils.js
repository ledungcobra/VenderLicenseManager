const keccak256 = require("keccak256");

const verifySignature = (web3, signature, plainText, account) => {
    if(!web3 || !signature || !plainText || !account) {
        if (!web3) {
            console.log("🚀 ~ file: index.js ~ line 8 ~ verifySignature ~ No web3");
        }
        if (!signature) {
            console.log("🚀 ~ file: index.js ~ line 10 ~ verifySignature ~ No signature");
        }
        if (!plainText) {
            console.log("🚀 ~ file: index.js ~ line 12 ~ verifySignature ~ No plainText");
        }

        if (!account) {
            console.log("🚀 ~ file: index.js ~ line 14 ~ verifySignature ~ No account");
        }
        return false
    }
    const recoveredAddress = web3.eth.accounts.recover(plainText, signature);
    return account?.toLowerCase() === recoveredAddress?.toLowerCase();
}

const generateClientSecret = (address, secret) => {
    return '0x' + keccak256(secret + address.toLowerCase()).toString('hex');
}

module.exports = {
    verifySignature,
    generateClientSecret
}