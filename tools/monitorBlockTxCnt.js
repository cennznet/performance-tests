

// Import the API
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const config = require('../src/config.js');

const typeRegistry = require('@polkadot/types/codec/typeRegistry');
typeRegistry.default.register({
    AssetId: 'u32'
});

var api = null;//await ApiPromise.create();

// const nodeServerWsIp = 'ws://cennznet-node-1.centrality.me:9944';
// const nodeServerWsIp = 'ws://127.0.0.1:9944';

// create api
async function init() {
    if (null == api) {
        let provider = new WsProvider(config.nodeServerWsIp);
        api = await ApiPromise.create(provider);
    }
}

async function main() {
    // Here we don't pass the (optional) provider, connecting directly to the default
    // node/port, i.e. `ws://127.0.0.1:9944`. Await for the isReady promise to ensure
    // the API has connected to the node and completed the initialisation process
    // api = await ApiPromise.create();
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
        
        // console.log(block.toJSON())  // block details

        // for (const tx of block.block.extrinsics) {   // extrinsics details
        //     console.log(tx.hash.toString(), ':', tx.method.meta.name.toString(), tx.method.toJSON())
        // }
    });



    // Id for the subscription, we can cleanup and unsubscribe via
    // `api.chain.newHead.unsubscribe(subscriptionId)`
    console.log(`subsciptionId: ${subscriptionId}`);
}

main().catch(console.error);
