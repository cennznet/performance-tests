require('../src/api/transaction')
require('../src/parameter');
require('../src/api/general')

var interval = 0;

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? wsIp = argv.ws : wsIp = 'ws://127.0.0.1:9944';
    argv.i ? interval = argv.i : interval = 50;    // time interval
}

// test code
async function topup(fileName, startId = 0) {
    let fromSeedLst = ['Alice','Bob','Eve','Dave']                       // local machine
    // let fromSeedLst = ['Andrea','Brooke','Courtney','Drew','Emily','Frank'] // dev

    let addrLst = await loadAddrFile(__dirname + '/../data/' + fileName)

    for ( let i = startId; i < addrLst.length; i++ )
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




async function run()
{
    getArgs()
    await topup('address_from.csv')
    await topup('address_to.csv')
    process.exit(1)
}

run()

/*  run cmd:
    1. local:   node tools/topup -i 100
    2. remote:  node tools/topup -i 100 --ws ws://10.1.1.100:9944
*/
