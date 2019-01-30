

const {sendMulti, getAddrBal, apiPool} = require('../src/api/transaction')


let fromSeed = null;
let toAddr = null;
let amount = 0;
let txNum = 0;

async function getArgs()
{
    const argv = require('yargs').argv;
    
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp('ws://127.0.0.1:9944');
    fromSeed = argv.f
    toAddr = argv.t
    argv.a ? amount = parseInt(argv.a) : amount = 1;    // transfer amount
    argv.n ? txNum = parseInt(argv.n) : txNum = 1;      // total number of tx
}

// test code
async function run() {
    await getArgs()

    let bal = await getAddrBal(toAddr);

    let nextBal = parseInt(bal.toString())  + txNum * amount;
    console.log(`bal = ${bal} + ${txNum} = ${nextBal}`);

    let t1 = new Date().getTime()
    await sendMulti(fromSeed, toAddr, amount, txNum);
    let t = new Date().getTime() - t1

    console.log(`Time for tx = ${(t)/1000}s`);

    process.exit()
}

run()

/*  run cmd:
    1. local:   node test/sendMultiTx -f Alice -t 5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG -a 1000 -n 10 --ws ws://127.0.0.1:9944
    2. dev:     node test/sendMultiTx -f Alice -t 5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG -a 1000 -n 10 --ws ws://3.1.51.215:9944
*/