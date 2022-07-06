const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb").MongoClient;
const Config = require("./config.json");
const routes = require("./routes");
const bodyParser = require("body-parser");
const server = require("http").createServer(app);
const {getRootContract, getAccounts, listenOnRootContract, getWeb3} = require("./contractutils");
const {socketListen} = require("./socket");
require('dotenv').config()
app.use(cors());
const io = require("socket.io")(server,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001

app.use(bodyParser.json());

// error handler
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

const dbUrl = `mongodb://${Config.username}:${Config.password}@localhost:27017/?authMechanism=DEFAULT`;
console.log(dbUrl);

mongodb.connect(
    dbUrl,
    {
        useUnifiedTopology: true,
    },
    async (err, client) => {
        if (err) {
            console.log("🚀 ~ file: index.js ~ line 41 ~ An An error occur connect to mongodb", err)
            return;
        }
        const db = client.db("blockchain");

        const accounts = await getAccounts();
        const RootLicense = getRootContract();
        const web3 = getWeb3();

        listenOnRootContract(db);
        socketListen(io, db, web3);
        routes(app, db, accounts, RootLicense);
        server.listen(PORT, () => {
            console.log("🚀 ~ file: index.js ~ line 54 ~ server.listen ~ PORT", PORT)
        })
    }
);

