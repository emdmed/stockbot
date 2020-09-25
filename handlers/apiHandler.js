const axios = require("axios")
const cheerio = require("cheerio")
const config = require("../config")
const chalk = require("chalk");
const fs = require("fs");
const CEDEARS = require("../balanzCEDEARS");
let mystocks = JSON.parse(fs.readFileSync("data/mystocks.json"));

async function fetchHTML(url) {
    const { data } = await axios.get(url)
    return cheerio.load(data)
}

var todayStockData = [];
var instanceStockData = [];
var profitArray = [];

const apiHandler = {
    searchStock,
    mainLoop,
    searchBuyStocks
}

async function searchStock(symbol){
    //look for prevclose, open and  current value
    const $ = await fetchHTML(config.url.production + symbol)

    let obj = {
        symbol: symbol,
        date: new Date(),
        current: parseFloat($("#quote-header-info").find("span[data-reactid='32']").text().replace(/,/g, "")),
        openValue: parseFloat($("span[data-reactid='103']").text().replace(/,/g, "")),
        prevClose: parseFloat($("span[data-reactid='98']").text().replace(/,/g, ""))
    }

    return obj
}

async function mainLoop(){
    console.log(new Date())
    console.log("Checking stock prices...")
    let allsymbols = findSymbols();
    await Promise.all(allsymbols.map(async (i)=>{
        let stockdata = await searchStock(i)
        todayStockData.push(stockdata);
        instanceStockData.push(stockdata);
    }))

    //console.log("All Stock Data ",todayStockData)

    //check if profit
    await checkForProfit();
    console.log("")
    console.log("")
}

async function checkForProfit(){
    console.log("")
    console.log("checking for profits...")
    console.log("--------------------------")
    mystocks = JSON.parse(fs.readFileSync("data/mystocks.json"));
    for(let j = 0; j < mystocks.length; j++){
        await Promise.all(instanceStockData.map(async (i)=>{
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

    const $2 = await fetchHTML("https://finance.yahoo.com/losers?offset=0&count=100")
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


//mainLoop()


//MAIN LOOP
setInterval(() => {

    let now = new Date();
  

    if(now.getHours() > 9 && now.getHours() < 18){
        console.log("Time - " + now.getHours() + ":" + now.getMinutes())
        mainLoop()
        searchBuyStocks()
    } 

    if(now.getHours() === 9 && now.getMinutes() === 59){
        console.log("---------------------")
        console.log("- * Market Open * -")
        console.log("---------------------")
    }

    if(now.getHours() === 15 && now.getMinutes() === 59){
        console.log("---------------------")
        console.log("- * Market Closed * -")
        console.log("---------------------")

        //render json file with all todays values and then reset
        console.log("Writing Stocks file...")
        fs.writeFileSync("data/historicalStockData/" + now.getDate() + "-" + now.getMonth() + 1 + "-" + now.getFullYear()  + "-data.json", JSON.stringify(todayStockData))
        todayStockData = [];
    }

}, 300000);



