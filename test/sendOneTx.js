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


// require('../src/api/transaction')
const {transferWithManualNonce, getAddrBal, apiPool} = require('../src/api/transactions')


async function getArgs()
{
    const argv = require('yargs').argv;
    
    
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp('ws://127.0.0.1:9944');
    fromSeed = argv.f
    toAddr = argv.t
    argv.a ? amount = parseInt(argv.a) : amount = 10000;
}

// test code
async function send(fromSeed, toAddr, amount) {

    let toAddress = toAddr

    

    let bal = await getAddrBal(toAddress);
    console.log('toAddress bal before = ', bal.toString())
    bal = await getAddrBal(fromSeed);
    console.log('fromSeed bal before = ', bal.toString())


    let result = await transferWithManualNonce(fromSeed, toAddress, amount, isWaitResult = true);
    // console.log('result = ', result)

    bal = await getAddrBal(toAddress);
    console.log('toAddress bal after = ', bal.toString())
    bal = await getAddrBal(fromSeed);
    console.log('fromSeed bal after = ', bal.toString())

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

/**
 * run command:
 *      - local:  node test/sendOneTx -f Alice -t James -a 10000
 *      - Kauri:  node test/sendOneTx -f Andrea -t James -a 10000 --ws wss://cennznet-node-0.centrality.me:9944
 */
// 
//      