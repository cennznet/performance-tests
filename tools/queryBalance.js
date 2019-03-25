const { ApiPromise } = require('@polkadot/api');
const { Api } = require('@cennznet/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const { stringToU8a, u8aToHex } = require('@cennznet/util');
const { Address, u32, u128 } = require('@polkadot/types') ;
const { AssetId } = require('cennznet-runtime-types');
const { xxhashAsHex } = require('@cennznet/util-crypto');
const { Keyring, decodeAddress } = require('@cennznet/util');

// const typeRegistry = require('@polkadot/types/codec/typeRegistry');
// typeRegistry.default.register({
//     AssetId: 'u32',
//     Topic: 'u256', 
//     Value: 'u256',
//     AssetOptions: { total_supply: 'Balance' }
// });

// const nodeServerWsIp = 'ws://cennznet-node-1.centrality.me:9944';
var nodeServerWsIp = "";
var address = "";

function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
    address = argv.a
}

async function listenBalChange(address) {
    // Create an await for the API
    const provider = new WsProvider(nodeServerWsIp);

    const api = await ApiPromise.create(provider);

    let _address = null;

    // Operate different input: seed or address
    if ( address.length == 48 ) {   // address
        _address = address
    }
    else{   // seed
        const seed = address.padEnd(32, ' ');
        const keyring = new Keyring();
        const fromAccount = keyring.addFromSeed(stringToU8a(seed));
        _address = fromAccount.address();
    }
    
    // get bal
    let bal = await api.query.balances.freeBalance(_address);

    console.log(`Bal = ${bal}`);

    return bal
}

async function queryFreeBalance( address, assetId = 0 ) {    // assetId: 0 - CENNZ, 10 - SPEND
    
    let _address = null;

    // Operate different input: seed or address
    if ( address.length == 48 ) {   // address
        _address = address
    }
    else{   // seed
        const seed = address.padEnd(32, ' ');
        const keyring = new Keyring();
        const fromAccount = keyring.addFromSeed(stringToU8a(seed));
        _address = fromAccount.address();
    }

    // prepare key for query
    const prefix = stringToU8a('ga:free:');
    const assetIdEncoded = new u32(new AssetId(assetId)).toU8a();
    const keyEncoded = new Uint8Array(prefix.length + assetIdEncoded.length);
    keyEncoded.set(prefix);
    keyEncoded.set(assetIdEncoded, prefix.length);
    const addrEncoded = u8aToHex(decodeAddress(new Address(_address).toString())).substr(2);
    const key = xxhashAsHex(keyEncoded, 128) + addrEncoded;

    // get balance
    const api = await Api.create({provider: nodeServerWsIp})
    const rawBalance = await api.rpc.state.getStorage(key);
    const balance = new u128(rawBalance).toString()

    // console.log(`${address}_${assetId} bal = `, balance.toString())

    return balance;
}


async function run() {

    getArgs()
    let bal = await queryFreeBalance(address)
    console.log('bal =', bal)
    process.exit()
}


run()

/*  run cmd:
    1. local:   
        node tools/queryBalance -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ --ws ws://127.0.0.1:9944
    2. remote:  
        node tools/queryBalance -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ --ws ws://3.1.51.215:9944
*/

