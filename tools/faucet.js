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



const {transfer, apiPool} = require('../src/api/transactions')
const {loadAddrFile} = require('../src/parameter');
// const {sleep} = require('../src/api/general')

var testEnv = '';
var fromSeedLst = [];

async function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp( 'ws://127.0.0.1:9944');
    argv.e ? testEnv = argv.e : testEnv = 'uat'   // test environment
}

function sleepMs(ms)
{
    if (ms < 0) {
       return
    }
    return new Promise(resolve => setTimeout(resolve, ms))
}

// test code
async function faucet(fileName) {
    console.log('Open the faucet...')

    const addrLst = await loadAddrFile(__dirname + '/../data/' + fileName)
    const addrNum = addrLst.length

    let i = 0

    while(true)
    {
        const seedId = i % fromSeedLst.length
        const seed = fromSeedLst[seedId]
        const toAddress = addrLst[i][1]
        let amt = Math.round( Math.random() * 1000 + 1000)

        console.log(`${seed} -> ${toAddress} with ${amt}`)
        try{
            await transfer( seed, toAddress, amt, 0)
        }
        catch(e){
           console.log('error =', e)
        }
        

        await sleepMs(1000)

        // reset index if reaches last address
        i >= (addrNum - 1) ? i = 0 : i++
    }
}


async function run()
{
    await getArgs()
    if (testEnv == 'dev' || testEnv == 'uat'){
        // dev
        fromSeedLst = ['Andrea','Brooke','Courtney','Drew','Emily','Frank'] 
    }
    else if ( testEnv == 'testnet' ){
        fromSeedLst = ['Bette']
    }
    else{
        // local machine
        // fromSeedLst = ['Alice','Bob','Eve','Dave']  
        fromSeedLst = ['Bob','Eve','Dave']  
    }

    await faucet('address_to.csv')
}

run()

/*  run cmd:
    node tools/faucet --ws NODE_WS_ADDRESS:PORT
*/
