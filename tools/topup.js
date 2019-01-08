require('../src/api/transaction')
require('../src/parameter');
require('../src/api/general')

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
        await sleep(50)
    }

    // process.exit(1)
}




async function run()
{
    await topup('address_from.csv')
    await topup('address_to.csv')
    process.exit(1)
}

run()