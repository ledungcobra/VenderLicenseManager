module.exports = function (app, db, accounts, contract) {
 
    app.get("/apps", (req, res) => {
        res.send("HEllo");
    });
    
    app.post("/updateAppSecret", async (req, res) => {
        const { secret, signature, appAddress } = req.body;
        const app = await db.collection("apps").findOne({ address: appAddress });
        if (!app) return res.status(404).send("App not found");
        const isValid = await contract.methods.verifySignature(appAddress, secret, signature).call();
        if (!isValid) return res.status(400).send("Invalid signature");
        await db.collection("apps").updateOne({ address: appAddress }, { $set: { secret: secret } });
        res.send({
            message: "Secret updated",
        });
    });
};
