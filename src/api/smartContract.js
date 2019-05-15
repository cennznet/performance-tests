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

const {apiPool, signAndSendTx, getAddressFromSeed} = require('./transactions')

const fs = require('fs');


module.exports.putCode = async function(issuerSeed, gasLimit, contractFilePath){ 
    let currContractHash = ''

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

    // get the contract hash
    txResult.events.forEach(({ phase, event: { data, method, section } }) => {
        if (method == 'CodeStored'){
            currContractHash = data[0].toString()   // data is an array
        }
    });

    // check contact hash
    // if ( '' !== currContractHash ){
    //     txResult.bSucc = true
    // }
    // else{
    //     txResult.bSucc = false
    //     txResult.message = 'Smart contract putCode failed.'
    // }


    return currContractHash
}

module.exports.createContract = async function (issuerSeed, endowment, gasLimit, contractHash, contractJsonFilePath){ 

    let bSucc = false

    // get api
    const api = await apiPool.getWsApi()
    
    // read contract file
    let contractJsonCode = fs.readFileSync(contractJsonFilePath);

    // convert to hex
    contractJsonCode = '0x' + contractJsonCode.toString('hex')

    // make tranction
    const trans = api.tx.contract.create(endowment, gasLimit, contractHash, '0x')

    // sign and send tx
    const txResult = await signAndSendTx(api, trans, issuerSeed)

    // get the contract hash
    txResult.events.forEach(({ phase, event: { data, method, section } }) => {
        if (method == 'Instantiated'){
            bSucc = true
        }
    });


    return bSucc
}

module.exports.callContract = async function (issuerSeed, destSeed, value, gasLimit){ 

    let bSucc = false

    // get api
    const api = await apiPool.getWsApi()

    const destAddress = getAddressFromSeed(destSeed)

    // make tranction
    const trans = api.tx.contract.call(destAddress, value, gasLimit, '0x')

    // sign and send tx
    const txResult = await signAndSendTx(api, trans, issuerSeed)

    // get the contract hash
    txResult.events.forEach(({ phase, event: { data, method, section } }) => {
        if (method == 'Transfer'){
            bSucc = true
        }
    });


    return bSucc
}