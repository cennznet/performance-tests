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


const { Api } = require('@cennznet/api');
const { WsProvider } = require('@cennznet/api/polkadot');
const tx = require('../src/api/transaction')
const { GenericAsset}  = require('@cennznet/crml-generic-asset')


var nodeServerWsIp = "";
var address = "";

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
    address = argv.a
}

async function listenBalChange(seed) {
    // Create an await for the API
    const provider = new WsProvider(nodeServerWsIp);

    const api = await Api.create(provider);
    
    await tx.setApiSigner(api, seed)
    const ga = await GenericAsset.create(api);

    // Retrieve the initial balance. Since the call has no callback, it is simply a promise
    // that resolves to the current on-chain value
    let previous = await tx.queryFreeBalance(seed);

    console.log(`Bal = ${previous}`);

    // Here we subscribe to any balance changes and update the on-screen value
    await ga.getFreeBalance(16001, await tx.getAddressFromSeed(seed), (current) => {
        if (current == null || current <= 0 ){
            console.log('null or 0 balance, continue...', current.toString())
            return;
        }

        // Only display positive value changes (Since we are pulling `previous` above already,
        // the initial balance change will also be zero)
        if ( current.toString() === previous.toString() ) {
            console.log('Same Bal as before, continue...')
            return;
        }

        previous = current

        console.log(`${seed} Balance changed: Now = ${current.toString()}`);
    });
}



async function test() {

    getArgs()
    await listenBalChange(address)
}


test()

/*  run cmd:
    1. local:   
        node tools/listenBalChange -a Alice --ws ws://127.0.0.1:9944
    2. remote:  
        node tools/listenBalChange -a 5DnThWP9rpHMe4XRgLpyxaesK91JxsRbL5zDkFb6t4jUUyYU --ws ws://10.1.1.100:9944
*/

