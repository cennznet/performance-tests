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

global.totalTx = 0



class TxResult{
    constructor(){
        this.bSucc = true
        this.message = ''
    }
}



module.exports.ScenarioBase = class{
    constructor(userId = 0, iterationNum = 0){
        // generate an unique instance id to specify a class object
        this.instanceId = crypto.randomBytes(16).toString('hex')
        this.userId = userId
        this.iterationNum = iterationNum
        this.resultMsg = new TxResult()
    }

    transaction_start(txName){
        console.log(`User [${this.userId}]'s [${txName}] started at time [${new Date().getTime()}] `)
    }

    transaction_end(txName, isPassed){
        console.log(`User [${this.userId}]'s [${txName}] got result (${isPassed}) at time [${new Date().getTime()}] `)
    }
}

module.exports.TxResult = TxResult

// module.exports.callScn = async function(userId, loopCount) { // each user allocated a distinct seed
//     totalTx += 1
    
//     // create action instance
//     const action = new Action()

//     return await action.playSmartContract(userId, loopCount);
// }
