const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const { Keyring } = require('@cennznet/util');
const { stringToU8a } = require('@cennznet/util');


// const typeRegistry = require('@polkadot/types/codec/typeRegistry');
// typeRegistry.default.register({
//     AssetId: 'u32',
//     Topic: 'u256', 
//     Value: 'u256',
//     AssetOptions: { total_supply: 'Balance' }
// });

// const nodeServerWsIp = 'ws://cennznet-node-1.centrality.me:9944';
var nodeServerWsIp = "";
var hash = "";

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
    hash = argv.h

}

async function queryBlock(_hash) {
    // Create an await for the API
    const provider = new WsProvider(nodeServerWsIp);

    const api = await ApiPromise.create(provider);
    
    
    // get 
    const block = await api.rpc.chain.getBlock(_hash)

    console.log('block hash: ', block.block.hash.toString())
    console.log('extrinsics length = ', block.block.extrinsics.length - 1)

    // extrinsics details
    for (let tx of block.block.extrinsics) {
        console.log(tx.hash.toString(), ':', tx.method.meta.name.toString(), tx.method.toJSON())
    }

    return block
}


async function run() {

    getArgs()
    await queryBlock(hash)
    process.exit()
}


run()

/*  run cmd:
    1. local:   
        node tools/queryBlock -h 0x33d18c0dbb259f2df7ffdf4c2e2b2cb438f74cb3d4f7256cde0949665a20b87a --ws ws://127.0.0.1:9944
    2. remote:  
        node tools/queryBlock -h 0x33d18c0dbb259f2df7ffdf4c2e2b2cb438f74cb3d4f7256cde0949665a20b87a --ws ws://3.1.51.215:9944
*/

