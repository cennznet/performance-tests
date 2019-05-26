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

const {apiPool} = require('./api/transactions')
const statistics = require('./statistics') 

var blockSubscriptionId = 0;

module.exports.subscribeBlockTx = async function () {

    // get first api
    let api = apiPool.getWsApiById(0)

    prevTime = new Date().getTime();

    statistics.blockId = 0

    // Subscribe the new block
    const subscriptionId = await api.rpc.chain.subscribeNewHead(async (header) => {
        // get block interval
        let currTime = new Date().getTime();
        let blockTxCnt = 0;
        let blockTime = currTime - prevTime
        let blockNo = header.blockNumber.toString();

        if (blockTime > statistics.sampleMaxBlockTime){
            statistics.sampleMaxBlockTime = blockTime    // get sampleMaxBlockTime
        }
        prevTime = currTime;

        if ( blockNo != statistics.blockId ){
            statistics.blockId = blockNo
        }

        // console.log('header.blockNumber =', header.blockNumber.toString())
        // console.log('currTime =', currTime)

        // get extrinsic count
        new Promise(async (resolve,reject) => {

            let getBlockArgs = []
            if (blockNo) {
                if (blockNo.toString().startsWith('0x')) {
                    getBlockArgs = [blockNo]
                } else {
                    getBlockArgs = [await api.rpc.chain.getBlockHash(+blockNo)]
                }
            }

            const block = await api.rpc.chain.getBlock(...getBlockArgs)
            blockTxCnt = block.block.extrinsics.length - 1
            if (blockTxCnt > statistics.sampleMaxBlockTxCnt){    // get sampleMaxBlockTxCnt
                statistics.sampleMaxBlockTxCnt = blockTxCnt
            }
            resolve(true)
        })

    });

    // Id for the subscription, we can cleanup and unsubscribe via
    blockSubscriptionId = subscriptionId    // TODO: may have issue when test on multiple nodes
    return subscriptionId
}

module.exports.unsubscribeBlockTx = async function ()
{
    let api = apiPool.getWsApiById(0)
    await api.chain.newHead.unsubscribe(blockSubscriptionId);
}