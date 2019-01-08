
require('../src/api/transaction')

// test code
async function test() {
    let toAddress = '5FoUu88WdqSzZwWP64NS2Amb2m8oXkSs5jYaFufbhrW2qcPG'

    let bal = await getAddrBal(toAddress);
    console.log('bal before = ', bal.toString())

    await sendWaitConfirm('Alice', toAddress, 1000);

    bal = await getAddrBal(toAddress);
    console.log('bal after = ', bal.toString())


    process.exit(1)
}

test()