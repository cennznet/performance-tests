
const { Keyring } = require('@polkadot/keyring');
const { stringToU8a, hexToBn } = require('@polkadot/util');
const { SimpleKeyring, Wallet } = require('cennznet-wallet')
const { Api } = require('cennznet-api')

// const config = require('../config.js');

const typeRegistry = require('@polkadot/types/codec/typeRegistry');
typeRegistry.default.register({
    AssetId: 'u32',
    Topic: 'u256', 
    Value: 'u256',
    AssetOptions: { total_supply: 'Balance' }
});

// global.wsIp = []; // ws ip, TODO: will be an array

global.sampleMaxBlockTime = 0;
global.sampleMaxBlockTxCnt = 0;
// global.nonceList = [];

// var api = null;
var blockSubscriptionId = 0;

const NodeSelectMethod = {
    SEQUENCE:   'seqence',
    RANDOM:     'random',
}

// Manage multiple ws connections
class ApiPool{

    constructor() {
        this._wsIpLst = [];
        this._apiLst = [];
        this._usage = [];    // The number of call for each api
        this._apiSelectMethod = NodeSelectMethod.SEQUENCE  // or 'RANDOM'
        this._currApiId = -1;
    } 

    async addWsIp(newWsIp){
        // get ws IPs
        if ( typeof(newWsIp) === 'string' ){// If only one address, the 'newWsIp' is a string, otherwise is an array.
            this._wsIpLst.push(newWsIp)
        }
        else{
            this._wsIpLst = newWsIp
        }
        
        // create ws connections for each ip
        let id = 0
        for ( let wsIp of this._wsIpLst ){
            // console.log(wsIp)
            await this._addApi(wsIp)

            // init _usage
            this._usage[id++] = 0
        }
    }

    async _addApi(newWsIp){
        this._apiLst.push( await Api.create( {provider: newWsIp} ) ) 
    }

    getWsApiById(id){
        this._usage[id] ++; // usage + 1
        return this._apiLst[id]
    }

    setApiSelectMethod(method){
        switch (method){
            case    NodeSelectMethod.SEQUENCE:
                this._apiSelectMethod = NodeSelectMethod.SEQUENCE
                break;
            case    NodeSelectMethod.RANDOM:
                this._apiSelectMethod = NodeSelectMethod.RANDOM
                break;
            default:
                this._apiSelectMethod = NodeSelectMethod.SEQUENCE

        }
    }

    getWsApi(method = this._apiSelectMethod){
        let retApi = null;
        (method == NodeSelectMethod.SEQUENCE) ? retApi = this._getSequentWsApi() : retApi = this._getRandomWsApi();

        return retApi
    }

    getApiUsage(){
        return this._usage
        
    }

    _getRandomWsApi(){
        let apiCnt = this._apiLst.length
        let randomId = 0;

        // get random id
        if ( apiCnt == 1 ){
            randomId = apiCnt - 1
        }
        else{
            let random = Math.random()
            // console.log('random = ', random)
            randomId = Math.floor(random * apiCnt) // get int
            // console.log('randomId = ', randomId)
        }
        this._currApiId = randomId

        return this.getWsApiById(randomId)
    }

    _getSequentWsApi(){
        this._currApiId ++;
        if ( this._currApiId >= this._apiLst.length ) {
            this._currApiId = 0
        }
        return this.getWsApiById(this._currApiId)
    }
}

// Manage nonce for all addresses
class NoncePool{
    constructor() {
        this._nonceList = {     // nonce dictionary for all address
            'seed': -1,
        }
    } 

    async getNewNonce(api, seed){

        let newNonce = null
        let currNonce = this._nonceList[seed]

        // get nonce
        if ( !currNonce ){   // first time come in, get nonce from api
            newNonce = await this._getNonceFromApi(api, seed)
        }
        else{
            const currNonceInt = parseInt(currNonce.toString())
            let nextNonceInt = currNonceInt + 1
            newNonce = hexToBn(nextNonceInt.toString(16)) // convert to BN
        }

        // save new nonce
        this._nonceList[seed] = newNonce

        return newNonce
    }

    async _getNonceFromApi(api, fromSeed){
        let nonce = null

        try {
            const _fromSeed = fromSeed.padEnd(32, ' ');

            // Create an instance of the keyring
            const keyring = new Keyring();

            // Add Alice to our keyring (with the known seed for the account)
            const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

            // get current nonce
            nonce = await api.query.system.accountNonce(fromAccount.address())

        }
        catch (e) {
            console.log(`Error = ${e}`)
        }

        return nonce
    }
}

// create api
// async function init() {
//     if (null == api) {
//         let provider = new WsProvider(wsIp);
//         api = await ApiPromise.create(provider);
//     }
// }

async function getAddrBal(address) {
    let api = apiPool.getWsApiById(0)
    let bal = await api.query.balances.freeBalance(address);
    return bal
}

async function sendWaitConfirm(fromSeed, toAddress, amount) {

    var bSucc = false;
    var message = "";

    let api = apiPool.getWsApi()

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
        // await init();
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

async function sendWithManualNonce(fromSeed, toAddress, amount, isWaitResult = false) {

    var bSucc = false;
    var message = "";
    const txValidStatus = {'Future':0,'Ready':1,'Finalised':2,'Broadcast':4};
    let api = null

    // console.log(`>>>>>>>>>>> ${fromSeed} in`)

    try {
        api = apiPool.getWsApi()

        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add seed to keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Get usable nounce
        const nonce = await noncePool.getNewNonce(api, fromSeed)
        // console.log('nonce = ',nonce.toString())
        message = nonce;
        // console.log('nonce = ', nonce.toString())

        // Create a extrinsic
        const transfer = api.tx.balances.transfer(toAddress, amount);

        // Sign the transaction using account
        transfer.sign(fromAccount, nonce);

        // Send transaction
        bSucc = await new Promise(async (resolve,reject) => {
            
            await transfer.send((r) => {
                // console.log(`${fromSeed} -- type = `, r.type)

                // check status
                if ( !(r.type in txValidStatus ) ){
                    console.log(`WARN: Transaction status is '${r.type}'` )
                    reject(false)
                }
                else{
                    if (isWaitResult){
                        // Only 'Finalised' can be successful
                        if ( r.type == 'Finalised' ){
                            // console.log('Finalised')
                            // console.log('hash =', r.status.raw.toString())
                            // resolve(r.status.raw.toString()); // get hash
                            resolve(true)
                        }
                    }
                    else{
                        resolve(true);
                    }
                }
            }).catch((error) => {
                console.log('Error =', error);
                // done();
            }); 
        });
    }
    catch (e) {
        message = e
        bSucc = false
        console.log('Error Msg = ', e)
    }

    // console.log(`<<<<<<<<<<<< ${fromSeed} out`)

    return { bSucc, message };
}

async function subscribeBlockTx() {

    // get first api
    let api = apiPool.getWsApiById(0)

    prevTime = new Date().getTime();

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
    let api = apiPool.getWsApiById(0)
    await api.chain.newHead.unsubscribe(blockSubscriptionId);
}

async function sendMulti(fromSeed, toAddressList, amount, txCount) {

    let api = apiPool.getWsApi()

    try {
        const _fromSeed = fromSeed.padEnd(32, ' ');

        // Create an instance of the keyring
        const keyring = new Keyring();

        // Add Alice to our keyring (with the known seed for the account)
        const fromAccount = keyring.addFromSeed(stringToU8a(_fromSeed));

        // Retrieve the nonce for Alice, to be used to sign the transaction
        // await init();
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

async function transfer(fromSeed, toAddress, amount, assetId = currency.CENNZ ) {
    // console.log('api = ', nodeApi._api)
    const api = await apiPool.getWsApi()
    // const api = await Api.create( {provider: 'ws://127.0.0.1:9944'} ) 
    
    const _fromSeed = fromSeed.padEnd(32, ' ')

    // Create an instance of the keyring
    const tempKeyring = new Keyring();
    // get account of seed
    const fromAccount = tempKeyring.addFromSeed(stringToU8a(_fromSeed));

    // create wallet
    const wallet = new Wallet();
    await wallet.createNewVault('a passphrase');
    const keyring = new SimpleKeyring();
    await keyring.addFromSeed(stringToU8a(_fromSeed));
    await wallet.addKeyring(keyring);

    // set wallet as signer of api
    
    api.setSigner(wallet)

    const _nonce = await noncePool.getNewNonce(api, fromSeed)
    
    // Send and wait nonce changed
    const result = await new Promise(async (resolve,reject) => {
        await api.tx.genericAsset.transfer(assetId, toAddress, amount).send({from: fromAccount.address(), nonce: _nonce }, r => {
            if ( r.type == 'Ready' || r.type == 'Finalised'){
                // console.log('hash =', r.status.raw.toString())
                resolve(r.type.toString()); // get hash
            }
        }).catch((error) => {
            // console.log('Error =', error);
            reject(error)
            // done()
        });
    });

    return result
}


const apiPool = new ApiPool();
const noncePool = new NoncePool();

module.exports.apiPool = apiPool

// module.exports.send = send;
module.exports.sendWaitConfirm = sendWaitConfirm;
module.exports.getAddrBal = getAddrBal;
module.exports.subscribeBlockTx = subscribeBlockTx;
module.exports.unsubscribeBlockTx = unsubscribeBlockTx;
module.exports.sendMulti = sendMulti;
module.exports.sendWithManualNonce = sendWithManualNonce;
module.exports.transfer = transfer;


// test code
async function test()
{
    await apiPool.addWsIp('ws://127.0.0.1:9944')
    await transfer('Alice', '5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ', 1000, 0)
   
    // process.exit()
}

// test()
