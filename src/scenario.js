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


// const { Action } = require('./action')
const { transfer } = require('./api/transactions')
const { loadTestAddress } = require('./parameter');
// const smc = require('./api/smartContract')
const crypto = require('crypto')
const assert = require('assert')
const statistics = require('./statistics') 

global.totalTx = 0



class TxResult{
    constructor(){
        this.bSucc = true
        this.message = ''
    }
}

class TxInfo{
    constructor(){
        this.txName = ''
        this.userId = -1
        this.iterationNum = -1
        this.startTime = null
        this.endTime = null
        this.responseTime = -1
        this.isPassed = false
    }
}



module.exports.ScenarioBase = class{
    constructor(userId = 0, iterationNum = 0){
        // generate an unique instance id to specify a class object
        // this.instanceId = crypto.randomBytes(16).toString('hex')
        this.userId = userId
        this.iterationNum = iterationNum
        this.resultMsg = new TxResult()
    }

    transaction_start(txName){  // TODO: maybe two same tx appear in one scenario
        // console.log(`User [${this.userId}]'s [${txName}] started at time [${new Date().getTime()}] `)
        const txId = `${txName}_${this.userId}_${this.iterationNum}`    // create tx id
        const txInfo = new TxInfo()
        txInfo.txName = txName
        txInfo.startTime = new Date().getTime()
        txInfo.userId = this.userId
        txInfo.iterationNum = this.iterationNum

        // add tx into dictionary
        txDict[txId] = txInfo

        statistics.trans_total++
    }

    transaction_end(txName, isPassed){
        // console.log(`User [${this.userId}]'s [${txName}] got result (${isPassed}) at time [${new Date().getTime()}] `)
        const txId = `${txName}_${this.userId}_${this.iterationNum}`
        // get tx info from dict
        const txInfo = txDict[txId]
        if ( txInfo != undefined ){
            txInfo.endTime = new Date().getTime()
            txInfo.responseTime = (txInfo.endTime - txInfo.startTime)
            txInfo.isPassed = isPassed

            // finished tx count
            statistics.trans_done++

            statistics.addTxResultToStatistics(txInfo.userId, txInfo.isPassed, txInfo.responseTime)
        }
        else{
            assert(false, `Cannot find transaction id: ${txId}`)
        }
    }
}

module.exports.TxResult = TxResult

// create a tx dict, the key will be the tx id.
var txDict = new Array()
