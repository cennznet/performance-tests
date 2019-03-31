const {sendWithManualNonce, apiPool} = require('../src/api/transaction')
const {loadAddrFile} = require('../src/parameter');
const {sleep} = require('../src/api/general')

var interval = 0;
var testEnv = '';
var fromSeedLst = [];
var topupCnt = 0;
var startNum = 0;
var amount = 0;

async function getArgs()
{
    const argv = require('yargs').argv;
    // argv.ws ? wsIp = argv.ws : wsIp = 'ws://127.0.0.1:9944';
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp( 'ws://127.0.0.1:9944');
    argv.i ? interval = argv.i : interval = 50;    // time interval
    argv.e ? testEnv = argv.e : testEnv = 'local'   // test environment
    argv.c ? topupCnt = argv.c : topupCnt = 10000   // total address count to topup, default is 10k
    argv.s ? startNum = argv.s : startNum = 0;
    argv.a ? amount = argv.a : amount = 10000;      // top-up amount
}

// test code
async function topup(fileName, startId = 0, endId = 10000, amt = amount) {
    console.log('Start to top up...')

    let addrLst = await loadAddrFile(__dirname + '/../data/' + fileName)
    console.log('startId = ',startId)
    console.log('endId = ',endId)

    for ( let i = startId; i < addrLst.length && i <= endId ; i++ )
    {
        let seedId = i % fromSeedLst.length
        let seed = fromSeedLst[seedId]
        let toAddress = addrLst[i][1]

        console.log(`tx = ${i}, ${seed} -> ${toAddress}`)

        for ( let j = 0; j< 60; j++ ){
            let retObj = await sendWithManualNonce( seed, toAddress, amt);

            if ( retObj.bSucc ) break;
            else {
                console.log(' --> retry')
                await sleep(1000)
            }
        }
        await sleep(interval)
    }

    // process.exit()
}


async function topupAll()
{
    await getArgs()
    if (testEnv == 'dev'){
        // dev
        fromSeedLst = ['Andrea','Brooke','Courtney','Drew','Emily','Frank'] 
    }
    else if ( testEnv == 'testnet' ){
        fromSeedLst = ['Bette']
    }
    else{
        // local machine
        fromSeedLst = ['Alice','Bob','Eve','Dave']  
    }

    await topup('address_from.csv', startNum, endId = startNum + topupCnt - 1, amount)
    await topup('address_to.csv', startNum, endId = startNum + topupCnt - 1, amount)
    process.exit()
}

module.exports = topupAll;
// topupAll()

/*  run cmd:
    1. local:   node src/run --topup -i 100 -s 0 -c 10000
    2. dev:     node src/run --topup -i 50 -e local -s 0 -c 1000 --ws=ws://3.1.51.215:9944
*/
