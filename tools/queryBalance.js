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



const tx = require('../src/api/transactions');

var nodeServerWsIp = "";
var address = "";
var assetId = 16001

async function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
    address = argv.s
    argv.a ? assetId = argv.a : assetId = 16001

    await tx.apiPool.addWsIp(nodeServerWsIp)
}


async function run() {

    await getArgs()
    let bal = await tx.queryFreeBalance(address, assetId)
    console.log('bal =', bal)
    process.exit()
}


run()

/*  run cmd:
        node tools/queryBalance -s James -a 16000 --ws NODE_WS_ADDRESS:PORT
*/

