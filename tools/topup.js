// Copyright 2019 Centrality Investments Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const {transferWithManualNonce, apiPool} = require('../src/api/transactions')
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
    argv.i ? interval = argv.i : interval = 100;    // time interval
    argv.e ? testEnv = argv.e : testEnv = 'local'   // test environment
    argv.c ? topupCnt = argv.c : topupCnt = 10000   // total address count to topup, default is 10k
    argv.s ? startNum = argv.s : startNum = 0;
    argv.a ? amount = argv.a : amount = 10000000;      // top-up amount
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
        let seedFrom = fromSeedLst[seedId]
        let seedTo = addrLst[i][0]

        console.log(`tx = ${i}, ${seedFrom} -> ${seedTo}`)

        for ( let j = 0; j< 60; j++ ){
            let retObj = await transferWithManualNonce( seedFrom, seedTo, amt);

            if ( retObj.bSucc ) break;
            else {
                console.log(' --> retry')
                await sleep(1000)
            }
        }
        await sleep(interval)
    }
}


async function topupAll()
{
    await getArgs()
    if (testEnv == 'dev' || testEnv =='uat' ){
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
    // await topup('address_to.csv', startNum, endId = startNum + topupCnt - 1, amount)
    process.exit()
}

module.exports = topupAll;
// topupAll()

/*  run cmd:
    1. local:   node src/run --topup
            or: node src/run --topup -i 100 -s 0 -a 100000
    2. dev:     node src/run --topup -i 50 -e local -s 0 -c 1000 --ws=ws://3.1.51.215:9944
    3. uat:     node src/run --topup -i 0 -e uat --ws=wss://cennznet-node-0.centrality.cloud:9944
*/
