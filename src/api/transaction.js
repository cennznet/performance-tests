// Import the API, Keyring and some utility functions
const { ApiPromise } = require('@polkadot/api');
const { WsProvider } = require('@polkadot/rpc-provider');
const { Keyring } = require('@polkadot/keyring');
const { stringToU8a, hexToBn } = require('@polkadot/util');

// const config = require('../config.js');

const typeRegistry = require('@polkadot/types/codec/typeRegistry');
typeRegistry.default.register({
    AssetId: 'u32'
});

global.wsIp = []; // ws ip, TODO: will be an array

global.send = send;
global.sendWaitConfirm = sendWaitConfirm;
global.getAddrBal = getAddrBal;
// global.init = init;
global.subscribeBlockTx = subscribeBlockTx;
global.unsubscribeBlockTx = unsubscribeBlockTx;
global.sendMulti = sendMulti;
global.sendWithManualNonce = sendWithManualNonce;

global.sampleMaxBlockTime = 0;
global.sampleMaxBlockTxCnt = 0;
global.nonceList = [];

var api = null;
var blockSubscriptionId = 0;


// var nonceList = []; // all latest nonce for all seeds

// create api
async function init() {
    if (null == api) {
        let provider = new WsProvider(wsIp);
        api = await ApiPromise.create(provider);
    }
}

async function getAddrBal(address) {

    await init();
    // Create an await for the API
    // const provider = new WsProvider(config.nodeServerWsIp);
    // const api = await ApiPromise.create(provider);

    // Retrieve the initial balance. Since the call has no callback, it is simply a promise
    // that resolves to the current on-chain value
    let bal = await api.query.balances.freeBalance(address);

    // console.log(`Address[${address}] has a ${bal} balance`);
    // console.log(`You may leave this example running and start example 06 or transfer any value to ${Alice}`);

    return bal
}

async function send(fromSeed, toAddress, amount) {

    var bSucc = false;
    var message = "";

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Instantiate the API
        // const provider = new WsProvider(config.nodeServerWsIp);
        // const api = await ApiPromise.create(provider);

        // Retrieve the nonce for Alice, to be used to sign the transaction
        await init();
        const nonce = await api.query.system.accountNonce(fromAccount.address());

        // Create a extrinsic, transferring 12345 units to Bob. We can also create,
        // sign and send in one operation (as per the samples in the Api documentation),
        // here we split it out for the sake of readability
        const transfer = api.tx.balances.transfer(toAddress, amount);

        // Sign the transaction using our account
        transfer.sign(fromAccount, nonce);

        // Send the transaction and retrieve the bSuccing Hash
        const hash = await transfer.send();

        // console.log(`Hash = ${hash}, lengh = ${hash.toString().length}`);

        if (hash.toString().length == 66)
            bSucc = true;
        else
            bSucc = false;
    }
    catch (e) {
        message = e
    }

    return { bSucc, message };
}

async function sendWaitConfirm(fromSeed, toAddress, amount) {

    var bSucc = false;
    var message = "";

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Instantiate the API
        // const provider = new WsProvider(config.nodeServerWsIp);
        // const api = await ApiPromise.create(provider);

        // Retrieve the nonce for Alice, to be used to sign the transaction
        await init();
        const nonce = await api.query.system.accountNonce(fromAccount.address());
        // console.log('nonce = ', nonce)
        
        const transfer = api.tx.balances.transfer(toAddress, amount);

        // Sign the transaction using our account
        transfer.sign(fromAccount, nonce);

        // Send the transaction and retrieve the bSuccing Hash
        // const hash = await transfer.send();

        // Send and wait nonce changed
        const hash = await new Promise(async (resolve,reject) => {
            await transfer.send((r) => {
                if ( r.type == 'Finalised' ){
                    // console.log('hash =', r.status.raw.toString())
                    resolve(r.status.raw.toString()); // get hash
                }
            }).catch((error) => {
                console.log('Error =', error);
                done();
            });
        });

        // console.log(`Hash = ${hash}, lengh = ${hash.toString().length}`);

        if (hash.length == 66){
            bSucc = true;
            message = 'hash = ' + hash;
        }   
        else
            bSucc = false;
    }
    catch (e) {
        message = e
    }

    return { bSucc, message };
}

async function sendWithManualNonce(fromSeed, toAddress, amount, isWaitResult = true) {

    var bSucc = false;
    var message = "";

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Instantiate the API
        // const provider = new WsProvider(config.nodeServerWsIp);
        // const api = await ApiPromise.create(provider);

        // Retrieve the nonce for Alice, to be used to sign the transaction
        await init();
        const nonce = await getNonce(fromSeed)
        message = nonce;
        // console.log('nonce = ', nonce.toString())

        // Create a extrinsic, transferring 12345 units to Bob. We can also create,
        // sign and send in one operation (as per the samples in the Api documentation),
        // here we split it out for the sake of readability
        const transfer = api.tx.balances.transfer(toAddress, amount);

        // Sign the transaction using our account
        transfer.sign(fromAccount, nonce);

        // Send the transaction and retrieve the bSuccing Hash
        if ( isWaitResult ){
            const hash = await transfer.send();

            if (hash.toString().length == 66){
                message = 'hash = ' + hash;
                bSucc = true;
            }
            else
                bSucc = false;
        }
        else
        {
            transfer.send();
            bSucc = true;
        }
        
    }
    catch (e) {
        message = e
        bSucc = false
    }

    return { bSucc, message };
}

async function subscribeBlockTx() {

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
        // get block interval
        let currTime = new Date().getTime();
        let blockTxCnt = 0;
        let blockTime = currTime - prevTime
        // console.log('blockTime = ',blockTime)

        if (blockTime > sampleMaxBlockTime){
            sampleMaxBlockTime = blockTime    // get sampleMaxBlockTime
        }
        prevTime = currTime;

        let blockNo = header.blockNumber;

        let getBlockArgs = []
        if (blockNo) {
            if (blockNo.toString().startsWith('0x')) {
                getBlockArgs = [blockNo]
            } else {
                getBlockArgs = [await api.rpc.chain.getBlockHash(+blockNo)]
            }
        }
        // get block information
        const block = await api.rpc.chain.getBlock(...getBlockArgs)
        blockTxCnt = block.block.extrinsics.length - 2
        if (blockTxCnt > sampleMaxBlockTxCnt){    // get sampleMaxBlockTxCnt
            sampleMaxBlockTxCnt = blockTxCnt
        }

        // console.log(block.toJSON())  // block details

        // for (const tx of block.block.extrinsics) {   // extrinsics details
        //     console.log(tx.hash.toString(), ':', tx.method.meta.name.toString(), tx.method.toJSON())
        // }
    });

    // Id for the subscription, we can cleanup and unsubscribe via
    // `api.chain.newHead.unsubscribe(subscriptionId)`
    // console.log(`subsciptionId: ${subscriptionId}`);
    blockSubscriptionId = subscriptionId
    return subscriptionId
}

async function unsubscribeBlockTx()
{
    await init();
    await api.chain.newHead.unsubscribe(blockSubscriptionId);
}

async function sendMulti(fromSeed, toAddressList, amount, txCount) {

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Retrieve the nonce for Alice, to be used to sign the transaction
        await init();
        let nonce = await api.query.system.accountNonce(fromAccount.address());
        nonceInt = parseInt(nonce.toString());
        console.log(`start nonce = ${nonce.toString()}`)
        
        let transfer = api.tx.balances.transfer(toAddressList, amount);
        transfer.sign(fromAccount, nonce);
        let hash = await transfer.send();

        for (let i = 0; i < txCount - 1; i++ )
        {
            nonceInt += 1
            nonce = hexToBn(nonceInt.toString(16)) // convert to BN
            
            transfer.sign(fromAccount, nonce);
            // hash = await transfer.send();
            // console.log('hash = ', hash.toString())
            transfer.send();
        }
        
        console.log('End nonce = ',nonce.toString())
        console.log('--- Done ---')
    }
    catch (e) {
        console.log(`Error = ${e}`)
    }
}

async function getNonce(fromSeed) {

    let nonce = null

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Retrieve the nonce for Alice, to be used to sign the transaction
        await init();

        // get current nonce
        nonce = await api.query.system.accountNonce(fromAccount.address());

        // const prevNonce = getNonceFromList(fromSeed)
        const currNonceInt = parseInt(nonce.toString())
        const prevNonceInt = parseInt(getNonceFromList(fromSeed).toString())

        if ( prevNonceInt >= currNonceInt ) // need to use int to compare value, cannot use BN number
        {
            // console.log('prevNonce = ', prevNonceInt, 'curr nonce = ', currNonceInt)

            // calculate a new nonce value and save it
            let newNonceInt = prevNonceInt + 1;
            nonce = hexToBn(newNonceInt.toString(16)) // convert to BN
        }
        
        // save nonce to the list
        saveNonce(fromSeed,nonce);
    }
    catch (e) {
        console.log(`Error = ${e}`)
    }

    // console.log(`return nonce = ${nonce.toString()}`)
    return nonce
}

function getNonceFromList(seed)
{
    let nonce = -1;

    for( let element of nonceList ){
        if (element[0] == seed){
            nonce = element[1];
            break;
        }
    }

    return nonce
}

function saveNonce(seed, nonce)
{
    let isExist = false;
    for( element of nonceList ){
        if (element[0] == seed )
        {
            element[1] = nonce
            isExist = true
            break;
        }
    };

    if ( !isExist )
        nonceList.push([seed, nonce])
}


// test code
async function test()
{
    console.log((await getNonce('perf_test_1000')).toString())
   
    process.exit()
}

// test()
