

global.loadTestAddress = loadTestAddress;
global.loadAddrFile = loadAddrFile;
// global.addressListFrom = addressListFrom;
// global.addressListTo = addressListTo;

global.addressListFrom = [];
global.addressListTo = [];

// var addressListFrom = [];   // [0] - seed, [3] - address
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
        addressList.push(addressLine);
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
