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


module.exports.callScn = async function(userId) { // each user allocated a distinct seed
    return await _sendTx(userId);
}

async function _sendTx(userId){
    let returnObj = [];
    let seedFrom = addressListFrom[userId][0];
    let seedTo = addressListTo[userId][0];

    returnObj = await transferWithManualNonce( seedFrom, seedTo, 1000);

    return returnObj;
}


async function _playSmartContract(userId){
    const contractFilePath = __dirname + '/../files/spin2win.wasm'
    // const contractHash = '0xef55f2f51f83c5dea3dd0ba33f654d00ca3f62e93929e4c0225e396c310fd1b3'
    const contractHash = '0xf7920e0110a280214c3f490f96cb1894761ac8fdbb7ebbc44cc9d8c46a78bbd4'
    const issuerSeed = addressListFrom[userId][0]
    const gasLimit = 10000
    const endowment = 1001

}
