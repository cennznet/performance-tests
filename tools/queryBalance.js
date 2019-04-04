
const tx = require('../src/api/transaction');

var nodeServerWsIp = "";
var address = "";

async function getArgs()
{
    const argv = require('yargs').argv;
    argv.ws ? nodeServerWsIp = argv.ws : nodeServerWsIp = 'ws://127.0.0.1:9944';
    address = argv.a

    await tx.apiPool.addWsIp(nodeServerWsIp)
}


async function run() {

    await getArgs()
    let bal = await tx.getAddrBal(address)
    console.log('bal =', bal)
    process.exit()
}


run()

/*  run cmd:
    1. local:   
        node tools/queryBalance -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ --ws ws://127.0.0.1:9944
    2. remote:  
        node tools/queryBalance -a 5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ --ws ws://3.1.51.215:9944
*/

