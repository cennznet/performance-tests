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

const {ScenarioBase, TxResult} = require('./scenario')
const smc = require('./api/smartContract')
const { transfer, waitBalanceChange } = require('./api/transactions')



const endowedSeedLst = ['Alice', 'Bob', 'Charlie', 'Eve', 'Dave', 'Ferdie']
var topupIndex = 0

module.exports.Action = class extends ScenarioBase{
    constructor(){
        super()
    }

    async _playTransfer(){
        let returnObj = [];
        let seedFrom = addressListFrom[this.userId];
        let seedTo = addressListTo[this.userId];

        this.transaction_start('transfer')
        returnObj = await transfer( seedFrom, seedTo, 1000, false);
        this.transaction_end('transfer', true)
    
        return returnObj;
    }

    /**
     * Run a smart contract work flow.
     * - check balance change to 
     */
    async playSmartContract(){
        let retMsg = this.resultMsg
        
        const contractWasmFilePath = __dirname + '/../files/spin2win.wasm'
        const contractJsonFilePath = __dirname + '/../files/spin2win.json'
        const currContractHash = '0x1adcb2e5becd80a4250534bd43e4f172a33ffcac5590e9777665677ebfc58285'
        // generate seed. For each iteration, contract needs different issuer to prevent dupliate error.
        const seqNo = 10000000 + this.iterationNum
        const issuerSeed = `${addressListFrom[this.userId]}_${seqNo}`
        const destSeed =  `${addressListTo[this.userId]}_${seqNo}`
    
        const gasLimit = '50000'
        const endowment = '10000000000000000000'
        const transferValue = '1'
        
        // let   currContractHash = ''
        let   txSucc = null
        
        /**
         * Step - 0: Topup issuer account
         */
        this.transaction_start('transfer_topup')
        const seedFrom = endowedSeedLst[topupIndex++ % endowedSeedLst.length]
        const topupAmt = '20000000000000000000'

        let transferResult =  transfer( seedFrom, issuerSeed, topupAmt, true);
        // if ( !transferResult.bSucc ){
        //     this.transaction_end('transfer_topup', false)
        //     retMsg.bSucc = false
        //     retMsg.message = `Top up from [${seedFrom}] to [${issuerSeed}] with amount [${endowment}] failed: ${transferResult.message}`
        //     return retMsg
        // }
        await waitBalanceChange(issuerSeed)
        this.transaction_end('transfer_topup', true)
    
    
        /**
         * Step - 1: Deploy contract
         */
        this.transaction_start('putCode')
        txSucc = smc.putCode(issuerSeed, gasLimit, contractWasmFilePath)
        // if ( currContractHash.length <= 0 ){
        //     this.transaction_end('putCode', false)
        //     retMsg.bSucc = false
        //     retMsg.message = 'Smart contract putCode() failed.'
        //     return retMsg
        // }
        await waitBalanceChange(issuerSeed)
        this.transaction_end('putCode', true)
    
        /**
         * Step - 2: Create contract instance
         */
        this.transaction_start('createContract')
        smc.createContract(issuerSeed, endowment, gasLimit, currContractHash, contractJsonFilePath)
        // if ( txSucc == false ){
        //     retMsg.bSucc = false
        //     retMsg.message = 'Smart contract createContract() failed.'
        //     return retMsg
        // }
        await waitBalanceChange(issuerSeed)
        this.transaction_end('createContract', true)
    
        /**
         * Step - 3: Call contract
         */
        this.transaction_start('callContract')
        smc.callContract(issuerSeed, destSeed, transferValue, gasLimit)
        // if ( txSucc == false ){
        //     retMsg.bSucc = false
        //     retMsg.message = 'Smart contract callContract() failed.'
        //     return retMsg
        // }
        await waitBalanceChange(destSeed)
        this.transaction_end('callContract', true)

        return retMsg
    }
}