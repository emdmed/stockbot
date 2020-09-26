const express = require("express");
const app = express();

//const bodyParser = require("body-parser");
const config = require("./config")
const port = 3000;
const apiHandler = require("./handlers/apiHandler");
const webpush = require("web-push")
const server = require("http").createServer(app);
const publicVapidKey = "BERFtuniQ3lkLYfgxI2p43QluJypt29m8pnMxbfzNJ8aQbokQENB5eBODaYj2fwM1cCel8Jtdpn0uDjdrJY6Fqs";
const privateVapidKey = "AgrtAP177VgGHuBBKC6Lvg53tDcYf5FO3Bj-PixRavg";
const bodyParser = require("body-parser");
const fs = require("fs");

app.use(express.static(__dirname + "/client"));

webpush.setVapidDetails("mailto:enrique.darderes@gmail.com", publicVapidKey, privateVapidKey)

app.use(bodyParser.json())
//config
config.environment.set();
//config.connectToDB();

//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());
//app.use(express.static(__dirname + "/client"));

app.post("/subscribe", function(req, res){
    const subscription = req.body
    
    //save endpoint
    fs.writeFileSync("endpoint.json", JSON.stringify(subscription))
    
    res.status(201).json({});

    const payload = JSON.stringify({title: "Push test"});

    webpush.sendNotification(subscription, payload).catch(err => console.log(err))
})


server.listen(process.env.PORT || port);
console.log("Init Stock Crawler ***")
apiHandler.runMainLoop()

