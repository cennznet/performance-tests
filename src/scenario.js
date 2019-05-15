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


const {transferWithManualNonce} = require('./api/transactions')
const {loadTestAddress} = require('./parameter');
const smc = require('./api/smartContract')

global.totalTx = 0

// module.exports.totalTx = totalTx

module.exports.callScn = async function(userId) { // each user allocated a distinct seed
    totalTx += 1
    
    return await _playSmartContract(userId);
    // return await _sendTx(userId)
}

module.exports.TxResult = class{
    constructor(){
        this.bSucc = false
        this.message = ''
    }
}

async function _sendTx(userId){
    let returnObj = [];
    let seedFrom = addressListFrom[userId];
    let seedTo = addressListTo[userId];

    returnObj = await transferWithManualNonce( seedFrom, seedTo, 1000);

    return returnObj;
}


async function _playSmartContract(userId){
    let retMsg = {bSucc: true, message: ""}
    
    const contractWasmFilePath = __dirname + '/../files/spin2win.wasm'
    const contractJsonFilePath = __dirname + '/../files/spin2win.json'
    const expectedContractHash = '0x1adcb2e5becd80a4250534bd43e4f172a33ffcac5590e9777665677ebfc58285'
    const issuerSeed = addressListFrom[userId]
    const destSeed = addressListTo[userId]
    const gasLimit = '50000'
    const endowment = '10000000000000000000'
    const transferValue = '1'
    
    let   currContractHash = ''
    let   txSucc = null
    
    /**
     * Step - 1: Deploy contract
     */
    currContractHash = await smc.putCode(issuerSeed, gasLimit, contractWasmFilePath)
    if ( currContractHash.length <= 0 ){
        retMsg.bSucc = false
        retMsg.message = 'Smart contract putCode() failed.'
        return retMsg
    }

    /**
     * Step - 2: Create contract instance
     */
    txSucc = await smc.createContract(issuerSeed, endowment, gasLimit, currContractHash, contractJsonFilePath)
    if ( txSucc == false ){
        retMsg.bSucc = false
        retMsg.message = 'Smart contract createContract() failed.'
        return retMsg
    }

    /**
     * Step - 3: Call contract
     */
    
    txSucc = await smc.callContract(issuerSeed, destSeed, transferValue, gasLimit)
    if ( txSucc == false ){
        retMsg.bSucc = false
        retMsg.message = 'Smart contract callContract() failed.'
        return retMsg
    }
    

    return retMsg
}
