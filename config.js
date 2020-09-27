let mongoose = require("mongoose")
let prod = true;

let config = {
    url: {
        production: "https://finance.yahoo.com/quote/",
        dev: "",
        local: ""
    },
    DB: "",
    connectToDB: async function(){
        try{
            await mongoose.connect(this.DB, {useNewUrlParser: true, useUnifiedTopology: true });
            console.log("Connected to DB");
        }catch{
            console.log("Error connecting to DB, retrying in 10");
            setTimeout(() => {
                this.connectToDB();
            }, 10000);
        }
    },
    environment: {
        production: prod,
        set(){
            if(this.production === false){
                config.connectToDB = ()=>{
                    console.log("no DB")
                }
            }
        }
    },
    dbName: "stocks",
    profit: 20,
    checkInterval: 30
}

module.exports = config;
