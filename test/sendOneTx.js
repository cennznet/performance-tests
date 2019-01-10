
require('../src/api/transaction')

function getArgs()
{
    const argv = require('yargs').argv;
    // console.log(argv)

    argv.ws ? wsIp = argv.ws : wsIp = 'ws://127.0.0.1:9944';
    fromSeed = argv.f
    toAddr = argv.t
    argv.a ? amount = parseInt(argv.a) : amount = 1000;
}

// test code
async function send() {

    let toAddress = '5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG'

    let bal = await getAddrBal(toAddress);
    console.log('bal before = ', bal.toString())

    let result = await sendWaitConfirm('Alice', toAddress, 1000);
    console.log('result = ', result)

    bal = await getAddrBal(toAddress);
    console.log('bal after = ', bal.toString())


    process.exit()
}


var fromSeed = ""
var toAddr = ""
var amount = ""
getArgs()
send(fromSeed, toAddr, amount)

// run code:
//      node test/sendOneTx -f Alice -t 5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG --ws ws://127.0.0.1:9944