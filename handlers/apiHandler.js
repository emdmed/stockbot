const axios = require("axios")
const cheerio = require("cheerio")
const config = require("../config")
const chalk = require("chalk");
const fs = require("fs");
const CEDEARS = require("../balanzCEDEARS");
const requestDelayInSeconds = 30 
const requestDelayInMinutes = 1
var MAINCLOCK = mainClock();
var figlet = require("figlet")
let mystocks = JSON.parse(fs.readFileSync("data/mystocks.json"));

async function fetchHTML(url) {
    const axiosresponse = await axios.get(url, {timeout: 1000} ).catch(err=>{console.log("Request timeout")})

    if(!axiosresponse){
        return "error"
    }else {
        return cheerio.load(axiosresponse.data)
    }

}

var todayStockData = [];
var instanceStockData = [];
var profitArray = [];

const apiHandler = {
    searchStock,
    mainLoop,
    searchBuyStocks,
    runMainLoop
}

async function searchStock(symbol){
    //look for prevclose, open and  current value
    const $ = await fetchHTML(config.url.production + symbol)
    if($ === "error"){

    } else {
        let obj = {
            symbol: symbol,
            date: new Date(),
            current: parseFloat($("#quote-header-info").find("span[data-reactid='32']").text().replace(/,/g, "")),
            openValue: parseFloat($("span[data-reactid='103']").text().replace(/,/g, "")),
            prevClose: parseFloat($("span[data-reactid='98']").text().replace(/,/g, ""))
        }
        return obj
    }
}

async function mainLoop(){
    console.log(new Date())
    console.log("Checking stock prices...")
    let allsymbols = findSymbols();
    await Promise.all(allsymbols.map(async (i)=>{
        let stockdata = await searchStock(i)
        if(stockdata === undefined){

        } else {
            todayStockData.push(stockdata);
            instanceStockData.push(stockdata);
        }
    }))

    return instanceStockData
}

async function checkForProfit(instanceStocks){
    console.log("")
    console.log("checking for profits...")
    console.log("--------------------------")
    mystocks = JSON.parse(fs.readFileSync("data/mystocks.json"));
    for(let j = 0; j < mystocks.length; j++){
        await Promise.all(instanceStocks.map(async (i)=>{
            if(mystocks[j].symbol === i.symbol){
                //symbols match
                //compare buy value with current value
                if(mystocks[j].price < i.current){
                    //check earnings
                    let result = i.current * 100 / mystocks[j].price - 100
                    let diff = i.current - mystocks[j].price;
                    console.log(result.toFixed(1), "% profit", chalk.green("(" + diff.toFixed(2) * mystocks[j].amount, " USD)"), i.symbol, " - bought at ", mystocks[j].price, " current price ", i.current)
                    profitArray.push(diff.toFixed(2) * mystocks[j].amount);

                    if(diff * mystocks[j].amount >= config.profit){
                        console.log(chalk.green("**SELL " + i.symbol + " **"))
                        //send push notification to device
                    }
                    console.log("--------------------------")
                } else {
                    console.log(i.symbol + " No profit")
                }

            } else {
            }
        }))
    }

    instanceStockData = [];

    //total profits
    console.log("Total profits")
    console.log(
        profitArray.reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
    )
    profitArray = [];
}



function findSymbols(){
    let obj = [];

    mystocks.forEach(element=>{

        let found = obj.indexOf(element.symbol)
        if(found === -1){
            obj.push(element.symbol)
        } 

    })

    console.log(obj)
    return obj;
}

async function searchBuyStocks(){
    //get all major losers
    console.log("")
    console.log("-----")
    console.log("Getting major losers...")
    console.log("-----")
    console.log("")
    const $2 = await fetchHTML("https://finance.yahoo.com/losers?offset=0&count=100")
    if($2 === "error"){

    } else {
        let line = $2("td[aria-label='Symbol']")
        let loss = $2("td[aria-label='% Change']")
        for(let i = 0; i < line.length; i++){
            //check if available at Balanz CEDEARS
            let found = CEDEARS.indexOf($2(line[i]).text())
            if(found === -1){} else {
                console.log("CEDEAR available for purchase: " + $2(line[i]).text() + " " +  $2(loss[i]).text())
                let stocktobuy = await searchStock($2(line[i]).text())
                console.log(stocktobuy)
            }
        }
    }
}

//MAIN LOOP
function runMainLoop(){
    setInterval(async () => {
        let now = new Date();
        console.log("Running mainloop...")

        if(now.getHours() > 8 && now.getHours() <= 15){
            console.log("Time - " + MAINCLOCK)
            let instance = await mainLoop()
            if(instance.length === 0){
                console.log("Instance HTML error")
            } else {
                await checkForProfit(instance);
                await searchBuyStocks()
            }
        } 
    
        if(MAINCLOCK === "15:01"){
            console.log("---------------------")
            console.log("- * Market Closed * -")
            console.log("---------------------")

            if(fs.existsSync("data/historicalStockData/" + now.getDate() + "-" + now.getMonth() + 1 + "-" + now.getFullYear()  + "-data.json")){

            } else {
                //render json file with all todays values and then reset
                console.log("Writing Stocks file...")
                fs.writeFileSync("data/historicalStockData/" + now.getDate() + "-" + now.getMonth() + 1 + "-" + now.getFullYear()  + "-data.json", JSON.stringify(todayStockData))
                todayStockData = [];
            }
      
        }
    
    }, requestDelayInMinutes * 60000);
}

function mainClock(){
    setInterval(() => {
        let now = new Date();
        let minutes = 0;
        if(now.getMinutes().length === 1){
            minutes = "0" + now.getMinutes()
        } else {
            minutes = now.getMinutes()
        }
        return now.getHours() + ":" + minutes
    }, 1000);
}


module.exports = apiHandler;



