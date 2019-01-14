
require('../src/api/transaction')

// test code
async function test() {
    let txCnt = 250;
    let toAddress = '5CxGSuTtvzEctvocjAGntoaS6n6jPQjQHp7hDG1gAuxGvbYJ'

    let bal = await getAddrBal(toAddress);

    let nextBal = parseInt(bal.toString())  + txCnt;
    console.log(`bal = ${bal} + ${txCnt} = ${nextBal}`);

    let t1 = new Date().getTime()
    await sendMulti('perf_test_1000', toAddress, 1, txCnt);
    let t = new Date().getTime() - t1

    console.log(`Time for tx = ${(t)/1000}`);

    // await process.exit()
}

test()