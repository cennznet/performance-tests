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

// Import the API
const { Api } = require('@cennznet/api');
const { WsProvider } = require('@cennznet/api/polkadot');
// const config = require('../src/config.js');


var api = null;//await Api.create();

// const nodeServerWsIp = 'ws://cennznet-node-1.centrality.me:9944';
// const nodeServerWsIp = 'ws://127.0.0.1:9944';
var nodeServerWsIp = ""

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
}

// create api
async function init() {
    if (null == api) {
        let provider = new WsProvider(nodeServerWsIp);
        api = await Api.create(provider);
    }
}

async function main() {

    let totalTxCnt = 0;

    // Here we don't pass the (optional) provider, connecting directly to the default
    // node/port, i.e. `ws://127.0.0.1:9944`. Await for the isReady promise to ensure
    // the API has connected to the node and completed the initialisation process
    await init();

    prevTime = new Date().getTime();
    // let header = await api.rpc.chain.

    // Subscribe to the new headers on-chain. The callback is fired when new headers
    // are found, the call itself returns a promise with a subscription that can be
    // used to unsubscribe from the newHead subscription
    const subscriptionId = await api.rpc.chain.subscribeNewHead(async (header) => {
        // console.log(`best #${header.blockNumber}`);
        console.log('===========================================');

        // get block interval
        let currTime = new Date().getTime();
        console.log(`clock = ${new Date().toLocaleString()}`)
        console.log(`timestamp = ${new Date().getTime()}`)
        console.log(`block time =  ${currTime - prevTime}`);
        prevTime = currTime;

        let blockNo = header.blockNumber;
        console.log(`blockNo =  ${blockNo}`);

        let getBlockArgs = []
        if (blockNo) {
            if (blockNo.toString().startsWith('0x')) {
                getBlockArgs = [blockNo]
            } else {
                getBlockArgs = [await api.rpc.chain.getBlockHash(+blockNo)]
                // console.log('getBlockArgs: ', getBlockArgs)
            }
        }
        const block = await api.rpc.chain.getBlock(...getBlockArgs)
        console.log('block hash: ', block.block.hash.toString())
        console.log('extrinsics length = ', block.block.extrinsics.length - 1)

        const currEraId = (await api.query.staking.currentEra()).toString()
        const currSessionId = (await api.query.session.currentIndex()).toString()
        const currEraReward = (await api.query.staking.currentEraReward()).toString() // era reward will change for each block
        const currSessionTxFee = (await api.query.rewards.sessionTransactionFee()).toString()

        console.log('currEraId =', currEraId)
        console.log('currSessionId =', currSessionId)
        console.log('currEraReward =', currEraReward)
        console.log('currSessionTxFee =', currSessionTxFee)


        totalTxCnt += block.block.extrinsics.length - 1;
        console.log('Total processed tx count = ',totalTxCnt)
        
        // console.log(block.toJSON())  // block details

        // extrinsics details
        // for (const tx of block.block.extrinsics) {   
        //     console.log(tx.hash.toString(), ':', tx.method.meta.name.toString(), tx.method.toJSON())
        // }
    });



    // Id for the subscription, we can cleanup and unsubscribe via
    // `api.chain.newHead.unsubscribe(subscriptionId)`
    // console.log(`subsciptionId: ${subscriptionId}`);
}

getArgs()
main().catch(console.error);

/*  run cmd:
    node tools/monitorBlockTxCnt --ws NODE_WS_ADDRESS:PORT
*/