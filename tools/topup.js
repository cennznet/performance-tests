require('../src/api/transaction')
require('../src/parameter');
require('../src/api/general')

var interval = 0;
var testEnv = '';
var fromSeedLst = [];
var topupCnt = 0;
var startNum = 0;

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? wsIp = argv.ws : wsIp = 'ws://127.0.0.1:9944';
    argv.i ? interval = argv.i : interval = 50;    // time interval
    argv.e ? testEnv = argv.e : testEnv = 'local'   // test environment
    argv.c ? topupCnt = argv.c : topupCnt = 10000   // total address count to topup, default is 10k
    argv.s ? startNum = argv.s : startNum = 0;
}

// test code
async function topup(fileName, startId = 0, endId = 10000) {
    // let fromSeedLst = ['Alice','Bob','Eve','Dave']                       // local machine
    // let fromSeedLst = ['Andrea','Brooke','Courtney','Drew','Emily','Frank'] // dev

    let addrLst = await loadAddrFile(__dirname + '/../data/' + fileName)

    for ( let i = startId; i < addrLst.length && i < endId ; i++ )
    {
        let seedId = i % fromSeedLst.length
        let seed = fromSeedLst[seedId]
        let toAddress = addrLst[i][3]

        console.log(`tx = ${i}, ${seed} -> ${toAddress}`)

        for ( let j = 0; j< 60; j++ ){
            let retObj = await sendWithManualNonce( seed, toAddress, 100000);
            // console.log('result =', retObj.bSucc)
            if ( retObj.bSucc ) break;
            else {
                console.log(' --> retry')
                await sleep(1000)
            }
        }
        await sleep(interval)
    }

    // process.exit(1)
}


async function topupAll()
{
    getArgs()
    if (testEnv == 'dev'){
        // dev
        fromSeedLst = ['Andrea','Brooke','Courtney','Drew','Emily','Frank'] 
    }
    else{
        // local machine
        fromSeedLst = ['Alice','Bob','Eve','Dave']  
    }

    await topup('address_from.csv', startNum, endId = startNum + topupCnt)
    await topup('address_to.csv', startNum, endId = startNum + topupCnt)
    process.exit()
}

module.exports = topupAll;
// topupAll()

/*  run cmd:
    1. local:   node src/run --topup -i 100 -e dev -s 0 -c 1000
    2. dev:     node src/run --topup -i 100 -e local -s 0 -c 1000 --ws ws://3.1.51.215:9944
*/
