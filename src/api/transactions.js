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


const { stringToU8a, hexToBn , Keyring } = require('@cennznet/util');
const { SimpleKeyring, Wallet } = require('@cennznet/wallet')
const { Api } = require('@cennznet/api')
const { WsProvider } = require('@cennznet/api/polkadot')
const { GenericAsset}  = require('@cennznet/crml-generic-asset')
const { sleep, CURRENCY } = require('./general')


const NodeSelectMethod = {
    SEQUENCE:   'seqence',
    RANDOM:     'random',
}


class TxResult{
    constructor(){
        this.bSucc = false
        this.message = ''
        this.blockHash = ''
        this.txHash = ''
        this.extrinsicIndex = -1
        this.byteLength = 0
        this.txFee = 0
        this.events = []
    }
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
        const provider = await new WsProvider(newWsIp)
        this._apiLst.push( await Api.create(provider) ) 
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
            const address = getAddressFromSeed(fromSeed)
            // get current nonce
            nonce = await api.query.system.accountNonce(address)
        }
        catch (e) {
            console.log(`Error = ${e}`)
        }

        return nonce
    }
}


function getAccount(seed){  // Note: Should call 'await cryptoWaitReady()' first if api is not created.
    const seedUri = '//' + seed
    const simpleKeyring = new SimpleKeyring(); 
    const account = simpleKeyring.addFromUri( seedUri); 
    return account
}

function getAddressFromSeed(seed){
    let address = null;

    // Operate different input: seed or address
    if ( seed.length == 48 ) {   // address
        address = seed
    }
    else{   // seed
        address = getAccount(seed).address()
    }

    return address
}

async function getAddrBal( seedOrAddress, assetId = CURRENCY.SPEND ) {    // assetId: 0 - CENNZ, 10 - SPEND

    // get balance via GenericAsset
    const api = apiPool.getWsApiById(0)
    const ga = await GenericAsset.create(api);
    const balance = await ga.getFreeBalance(assetId, getAddressFromSeed(seedOrAddress))

    return balance.toString();
}

async function setApiSigner(api, signerSeed){ // signerSeed - string, like 'Alice'
    // create wallet
    const wallet = new Wallet(); 
    await wallet.createNewVault('a passphrase'); 
    const keyring = new SimpleKeyring(); 
    const seedUri = '//' + signerSeed
    keyring.addFromUri(seedUri)
    await wallet.addKeyring(keyring);

    // set wallet as signer of api
    api.setSigner(wallet)

    return api
}

async function sendWaitConfirm(fromSeed, toAddress, amount) {

    var bSucc = false;
    var message = "";
    const assetId = CURRENCY.SPEND

    let api = apiPool.getWsApi()

    await setApiSigner(api, fromSeed)

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
        
        const transfer = api.tx.genericAsset.transfer(assetId, toAddress, amount)

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

async function transfer(fromSeed, toAddress, amount, isWaitResult = false) {

    const api = await apiPool.getWsApi()

    await setApiSigner(api, fromSeed)
    const ga = await GenericAsset.create(api)

    // convert to address if input is a seed
    const _toAddress = await getAddressFromSeed(toAddress)

    // Create a extrinsic
    const transfer = ga.transfer(CURRENCY.SPEND, _toAddress, amount)

    // send tx
    const txResult = signAndSendTx(api, transfer, fromSeed, -1, waitFinalised = isWaitResult)

    return txResult
}

async function signAndSendTx(api, transaction, seed, nonce_in = -1, waitFinalised = true){
    const txResult = new TxResult()

    let account = null
    let nonce = nonce_in

    // convert seed to account. Seed is String, account is Object
    // typeof(seedOrAccount) == 'string' ? account = getAccount(seedOrAccount) : account = seedOrAccount
    account = getAccount(seed)
    
    // if no nonce value, then get it
    if (nonce_in < 0){
        nonce = await noncePool.getNewNonce(api, seed);
    }

    // Send and wait nonce changed
    await new Promise(async (resolve,reject) => {
        // get tx hash and length (byte)
        const signedTx = transaction.sign(account, nonce)
        txResult.txHash = signedTx.hash.toString()
        txResult.byteLength = signedTx.encodedLength
        // send tx
        await transaction.send( async (r) => {
            // if donot wait, return straighaway
            if (waitFinalised != true){
                txResult.bSucc = true
                resolve(true); 
            }

            if ( r.status.isFinalized == true && r.events !== undefined ){
                // get block hash
                txResult.blockHash = r.status.raw.toString()
                // get extrinsic id
                txResult.extrinsicIndex = r.events[0].phase.asApplyExtrinsic.toString()
                // set tx result symbol
                txResult.bSucc = true
                // get all events
                txResult.events = r.events
                // get tx fee
                // txResult.txFee = await queryTxFee(txResult.blockHash, txResult.extrinsicIndex)

                // check if the extrinsic succeeded
                r.events.forEach(({ phase, event: { data, method, section } }) => {
                    if ( method == 'ExtrinsicFailed'){
                        txResult.bSucc = false
                        txResult.message = `Transaction failed: ${section}.${method}`
                    }
                });

                resolve(true); 
            }
            else if (r.type == 'Invalid'){
                txResult.bSucc = false
                txResult.events = r.events
                txResult.message = `Transaction type = ${r.type}`
                resolve(true);
            }
        }).catch((error) => {
            reject(error);
        });
    });

    return txResult
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

async function queryFreeBalance(address, assetId = CURRENCY.SPEND) {    // assetId: 0 - CENNZ, 10 - SPEND

    // get balance via GenericAsset
    const api = await apiPool.getWsApi()
    const ga = await GenericAsset.create(api);
    const _address = getAddressFromSeed(address)
    console.log('address = ', _address)
    const balance = await ga.getFreeBalance(assetId, _address)

    return balance.toString();
}

module.exports.waitBalanceChange = async function(seed, assetId = CURRENCY.SPEND, timeLimitSec = 60 ){
    // get api
    // get balance via GenericAsset
    const api = await apiPool.getWsApi()
    const ga = await GenericAsset.create(api);
    const address = getAddressFromSeed(seed)
    const previous = await ga.getFreeBalance(assetId, address)
    // console.log('previous =', previous.toString())
    let i = 0

    // check balance every second
    for (let i = 0; i < timeLimitSec; i++ ){
        let current = await ga.getFreeBalance(assetId, address)
        // console.log('current =', current.toString())
        if ( current.toString() != previous.toString() ) {
            break
        }
        
        await sleep(1000) // sleep for 1 s
    }

    // check if the balance changed
    if (i >= timeLimitSec){
        return false
    }
    else{
        return true
    }

    // listen to balance change
    const result = await new Promise(async (resolve, reject) => { 
        ga.getFreeBalance(assetId, address, (current) => {
            if (current == null || current <= 0 ){
                return;
            }
            // console.log('current =', current.toString())
            
        }).catch((error) => {
            reject(error)
        });
    })

    return result
}


const apiPool = new ApiPool();
const noncePool = new NoncePool();

module.exports.apiPool = apiPool

// module.exports.send = send;
module.exports.TxResult = TxResult 
module.exports.sendWaitConfirm = sendWaitConfirm;
module.exports.getAddrBal = getAddrBal;
// module.exports.subscribeBlockTx = subscribeBlockTx;
// module.exports.unsubscribeBlockTx = unsubscribeBlockTx;
module.exports.sendMulti = sendMulti;
module.exports.transfer = transfer;
module.exports.queryFreeBalance = queryFreeBalance;
module.exports.setApiSigner = setApiSigner
module.exports.signAndSendTx = signAndSendTx
module.exports.getAddressFromSeed = getAddressFromSeed

