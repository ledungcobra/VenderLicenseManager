const {verifySignature, generateClientSecret} = require("../common/utils");
const {APP_COLLECTION} = require("../common/constants");
const queueApps = {};
const socketListen = (io, db, web3) => {
    io.on("connection", (socket) => {
        console.log("A user connected");
        socket.on("disconnect", () => {
            console.log("🚀 ~ file: index.js ~ line 8 ~ socket.on ~ index",);
        });
        socket.on("CreateApp", async (data) => {
            queueApps[data.appAddress] = {
                ...data,
                onDoneAdd: () => {
                    socket.emit("AppAdded", data);
                },
            };
            console.log("🚀 ~ file: index.js ~ line 18 ~ socket.on ~ ", data);
        });

        socket.on("GetMySecret", async (data) => {
            const {signature, account,appAddress} = data
            const isValid = verifySignature(web3, signature,account, account);
            if (!isValid) {
                socket.emit("ReceiveMySecret", {error: "Invalid signature"});
                return;
            }
            if(!appAddress){
                socket.emit("ReceiveMySecret", {error: "No app address"});
                return;
            }
            const app = await db.collection(APP_COLLECTION).findOne({address: appAddress});
            if (!app) {
                socket.emit("ReceiveMySecret", {error: "No app found"});
                return;
            }
            socket.emit("ReceiveMySecret", {error: false, secret: generateClientSecret(account, app.secret)});
        });
    });

    console.log("Listening on socket");
};

const getAppData = (address) => {
    return new Promise((resolve, reject) => {
        if (queueApps[address]) {
            resolve(queueApps[address]);
        } else {
            setTimeout(() => {
                if (queueApps[address]) {
                    resolve(queueApps[address]);
                } else {
                    reject();
                }
            }, +process.env.QUEUE_WAIT_TIMEOUT || 10000);
        }
    });
};

const clearQueueElement = (address) => {
    delete queueApps[address];
};

module.exports = {
    socketListen,
    getAppData,
};
