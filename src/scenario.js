


const {sendWithManualNonce} = require('./api/transaction')
const {loadTestAddress} = require('./parameter');


// global.callScn = callScn;

async function callScn(userId)  // each user allocated a specified address
{
    return await _sendTx(userId);
}

async function _sendTx(userId)
{
    let returnObj = [];
    let seedFrom = addressListFrom[userId][0];
    let addrTo = addressListTo[userId][1];

    returnObj = await sendWithManualNonce( seedFrom, addrTo, 1);

    return returnObj;
}

/*
async function _sendTxAndWait(userId)
{
    let returnObj = [];
    let seedFrom = addressListFrom[userId][0];
    let addrTo = addressListTo[userId][3];

    // let prevBal = await _getBal(addrTo);

    returnObj = await send( seedFrom, addrTo, 1);

    // if send failed, return the result
    if (returnObj.bSucc == false)
        return returnObj

    // reset the result
    returnObj.bSucc = false;

    // wait for balance change
    let prevBal = await _getBal(addrTo);
    let waitTime = 60;
    for ( let i =0; i < waitTime; i++ )
    {   
        await sleep(1000);

        let currBal = await _getBal(addrTo);
        if ( currBal - prevBal < 0.00001 )  // currBal = prevBal
            continue;
        else    // balance changed
        {
            returnObj.bSucc = true;
            break; 
        }
    }

    if (returnObj.bSucc == false)
        returnObj.message = `Balance did not change in ${waitTime} seconds.`
    // console.log(`result = ${returnObj.result}`);

    return returnObj;
}

async function _getBal(address)
{
    return await getAddrBal(address)
}
*/

// test code
async function test()
{
    await loadTestAddress();

    for ( let i=0; i < 100; i++ )
        await callScn(i);
    
    console.log('=== done ===')
    process.exit()
}

module.exports = callScn;
// test()

