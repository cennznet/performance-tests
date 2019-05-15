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

global.addressListFrom = [];    // [0] - seed, [1] - address
global.addressListTo = [];

// var addressListFrom = [];   // [0] - seed, [1] - address
// var addressListTo = [];

async function loadAddrFile(filePath) 
{
    let fs = require('fs');

    let data = fs.readFileSync(filePath, "utf-8");

    let addressData = data.trim().split(/\r?\n/ig);   // split into lines

    let addressList = [];

    // v is value, i is index key
    addressData.forEach(function (v, i) {
        let addressLine = v.split(',')
        addressList.push(addressLine[0]);
    });

    return addressList;
}

// loadAddrFile(__dirname + '/../data/address_from.csv')
async function loadTestAddress()
{
    addressListFrom = await loadAddrFile(__dirname + '/../data/address_from.csv');
    addressListTo = await loadAddrFile(__dirname + '/../data/address_to.csv');
    // addressListTo = await loadAddrFile(__dirname + '/../data/address_from.csv');
    // addressListFrom = await loadAddrFile(__dirname + '/../data/address_to.csv');
}


// module.exports.addressListFrom = addressListFrom;
// module.exports.addressListTo = addressListTo;
// module.exports.addressListFrom = [];
// module.exports.addressListTo = [];

module.exports.loadAddrFile = loadAddrFile;
module.exports.loadTestAddress = loadTestAddress;