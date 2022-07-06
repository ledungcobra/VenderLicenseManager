const Web3 = require("web3");
const { APP_COLLECTION } = require("../common/constants");
const RootLicense = require("../contracts/RootLicense.json");
const { getAppData } = require("../socket");
const { verifySignature } = require("../common/utils");
const LicenseContractABI = require("../contracts/LicenseToken.json").abi;

if (typeof web3 !== "undefined") {
    var web3 = new Web3(web3.currentProvider);
} else {
    var web3 = new Web3(new Web3.providers.WebsocketProvider("ws://localhost:8545"));
}

const getRootContract = () => {
    const chainID = Object.keys(RootLicense.networks)[0];
    if (!chainID) {
        throw new Error("No chain ID found");
    }
    return new web3.eth.Contract(RootLicense.abi, RootLicense.networks[chainID].address);
};

const getLicenseContract = (address) => {
    return new web3.eth.Contract(LicenseContractABI, address);
};

const getAccounts = async () => {
    const accounts = await web3.eth.getAccounts();
    return accounts;
};

const listenOnRootContract = (db) => {
    console.log("Listening on the changes on the root contract");
    const rootContract = getRootContract();
    rootContract.events.OnAddedNewApp().on("data", async ({ returnValues }) => {
        try {
            const app = await db
                .collection(APP_COLLECTION)
                .findOne({ address: returnValues.appAddress });
            if (app) {
                console.log(
                    "🚀 ~ file: index.js ~ line 40 ~ rootContract.events.OnAddedNewApp ~ app already exists"
                );
                return;
            }
            const address = returnValues.appAddress;
            const owner = returnValues.owner;
            const secretData = await getAppData(address);
            if (!secretData) {
                console.log(
                    "🚀 ~ file: index.js ~ line 50 ~ rootContract.events.OnAddedNewApp ~ No secret data found"
                );
                return;
            }
            const isValid = verifySignature(web3, secretData.signature, owner, secretData.owner);
            if (!isValid) {
                console.log(
                    "🚀 ~ file: index.js ~ line 55 ~ rootContract.events.OnAddedNewApp ~ nvalid signature"
                );
                return;
            }
            await db
                .collection(APP_COLLECTION)
                .insertOne({ address, owner, secret: secretData.secret });
            secretData.onDoneAdd();
        } catch (e) {
            console.error(e);
        }
    });
    rootContract.events.OnAppActivated().on("data", async ({ returnValues }) => {
        console.log(
            "🚀 ~ file: index.js ~ line 71 ~ rootContract.events.OnAppActivated ~ An app activated"
        );
        const { appAddress } = returnValues;
        await db
            .collection(APP_COLLECTION)
            .updateOne({ address: appAddress }, { $set: { isActive: true } });
    });

    rootContract.events.OnAppDeactivated().on("data", ({ returnValues }) => {
        console.log(
            "🚀 ~ file: index.js ~ line 81 ~ rootContract.events.OnAppDeactivated ~ An app deactivated"
        );
        const { appAddress } = returnValues;
        db.collection(APP_COLLECTION).updateOne(
            { address: appAddress },
            { $set: { isActive: false } }
        );
    });
};

const getWeb3 = () => {
    return web3;
};

module.exports = {
    getRootContract,
    getLicenseContract,
    getAccounts,
    listenOnRootContract,
    getWeb3,
};
