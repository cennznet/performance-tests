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


const { ApiPromise } = require('@cennznet/api');
const { WsProvider } = require('@cennznet/api/polkadot');
const { Keyring } = require('@cennznet/util');
const { stringToU8a } = require('@cennznet/util');


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

