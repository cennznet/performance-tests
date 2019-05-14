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

const {apiPool, signAndSendTx} = require('./transactions')

const fs = require('fs');


module.exports.putCode = async function(issuerSeed, gasLimit, contractFilePath){ 
    // get api
    const api = await apiPool.getWsApi()

    // read contract file
    let contractCode = fs.readFileSync(contractFilePath);

    // convert to hex
    contractCode = '0x' + contractCode.toString('hex')
    
    // make tranction
    const trans = api.tx.contract.putCode(gasLimit, contractCode)

    // sign and send tx
    const txResult = await signAndSendTx(api, trans, issuerSeed)

    return txResult
}

module.exports.createContract = async function (issuerSeed, endowment, gasLimit, contractHash){ 
    // get api
    const api = await apiPool.getWsApi()
    
    // make tranction
    const trans = api.tx.contract.create(endowment, gasLimit, contractHash, '0x')

    // sign and send tx
    const txResult = await signAndSendTx(trans, issuerSeed)

    // console.log('events =', txResult.events)

    // txResult.events.forEach(({ phase, event: { data, method, section } }) => {
    //     console.log('phase =', phase)
    //     console.log('event =', event)
    // });

    return txResult
}