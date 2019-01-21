// require('../src/api/transaction')
const {sendWaitConfirm, getAddrBal, apiPool} = require('../src/api/transaction')

async function getArgs()
{
    const argv = require('yargs').argv;
    
    
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp('ws://127.0.0.1:9944');
    fromSeed = argv.f
    toAddr = argv.t
    argv.a ? amount = parseInt(argv.a) : amount = 1000;
    console.log('toAddr1 = ' + toAddr)
}

// test code
async function send(fromSeed, toAddr, amount) {

    let toAddress = toAddr

    

    let bal = await getAddrBal(toAddress);
    console.log('bal before = ', bal.toString())

    let result = await sendWaitConfirm(fromSeed, toAddress, amount);
    console.log('result = ', result)

    bal = await getAddrBal(toAddress);
    console.log('bal after = ', bal.toString())

    process.exit()
}

async function run()
{
    await getArgs()
    send(fromSeed, toAddr, amount)
}

var fromSeed = ""
var toAddr = ""
var amount = ""

run()


// run code:
//      node test/sendOneTx -f Alice -t 5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG --ws ws://127.0.0.1:9944