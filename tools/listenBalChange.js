const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
// const config = require('../src/config.js');

const typeRegistry = require('@polkadot/types/codec/typeRegistry');
typeRegistry.default.register({
    AssetId: 'u32'
});

// const nodeServerWsIp = 'ws://cennznet-node-1.centrality.me:9944';
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

    const api = await ApiPromise.create(provider);

    // Retrieve the initial balance. Since the call has no callback, it is simply a promise
    // that resolves to the current on-chain value
    let previous = await api.query.balances.freeBalance(seed);

    console.log(`Bal = ${previous}`);

    // Here we subscribe to any balance changes and update the on-screen value
    api.query.balances.freeBalance(seed, (current) => {
        if (current == null){
            return;
        }

        // Calculate the delta
        const change = current.sub(previous);

        // Only display positive value changes (Since we are pulling `previous` above already,
        // the initial balance change will also be zero)
        if (change.isZero()) {
            return;
        }

        previous = current;

        console.log(`Balance changed: Now = ${current}, ${change} changed`);
    });
}


async function test() {

    getArgs()
    await listenBalChange(address)
}


test()

/*  run cmd:
    1. local:   
        node tools/listenBalChange -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ
    2. remote:  
        node tools/listenBalChange -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ --ws ws://10.1.1.100:9944
*/

