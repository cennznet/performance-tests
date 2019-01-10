// const _scenario = require('./scenario')
// import callScn from './scenario'
require('./scenario')
require('./api/general')
require('./parameter');
// const tx = require('./api/transaction')
require('./api/transaction')
require('./html_chart/server')


async function callUserScenario(userId) {
    let txResult = null;
    let responseTime = 0;
    let startTime = 0;
    let endTime = 0

    

    startTime = new Date().getTime();

    trans_total++;
    txResult = await callScn(userId);
    trans_done++;

    endTime = new Date().getTime();

    responseTime = endTime - startTime;         // get tx response time

    // add the tx result into statistics
    addStatistics(userId, txResult, responseTime);

}

function addStatistics(userId, txResult, responseTime, totalResponseTime)
{
    let bSucc = txResult.bSucc;
    let message = txResult.message;
    let sameUserIdIndex = -1;

    let sampleSuccCnt = 0;
    let sampleFailCnt = 0;

    // total tx count
    // trans_total++;

    if (bSucc) // succ
    {   
        // total succ tx
        trans_succ++;
        sampleSuccCnt++;

        resp_total += responseTime;
        // resp_avg = Math.round(resp_total / trans_succ);

        if (responseTime > resp_max)    // get resp_max
            resp_max = responseTime;
        if (responseTime < resp_min)   // get resp_min
            resp_min = responseTime;
        
    }
    else  // failed
    {
        trans_fail++;
        sampleFailCnt++;
    }

    // ---- add tx result into sample list
    // get index of same user in the smaple list
    sameUserIdIndex = sample_list.findIndex(element => {
        return element[0] == userId;
    })

    if ( sameUserIdIndex < 0 )
    {// no same user, add a new element
        sample_list.push([userId, sampleSuccCnt, sampleFailCnt, responseTime])
    }
    else
    {// same user, add into existing data
        sample_list[sameUserIdIndex][1] += sampleSuccCnt;   // total succ count tx
        sample_list[sameUserIdIndex][2] += sampleFailCnt;   // total fail count tx
        sample_list[sameUserIdIndex][3] += responseTime;    // total response time including succ and fail tx
    }
}

async function iterateTask(userId) {
    // console.log('userId %d starts task', userId)

    if (isRunOnce) {
        await callUserScenario(userId)
    }
    else {
        while (!bTestStop) {
            await callUserScenario(userId)
    
            await sleep(pacingTime);
            // if (isRunOnce) bTestStop = true; // for once run, exit user
        }
    }
}

async function sample(intervalMs) {
    
    while (!bTestStop) 
    {
        await sleep(intervalMs)

        // copy sample content list
        let sampleList = sample_list.slice(); 
        // clear global list  
        sample_list = [];

        // get block info
        let _sampleMaxBlockTime = sampleMaxBlockTime
        let _sampleMaxBlockTxCnt = sampleMaxBlockTxCnt
        // reset original value to collect next time frame
        sampleMaxBlockTime = 0;
        sampleMaxBlockTxCnt = 0;


        let sampleTps = 0.0;
        let sampleSuccTxCnt = 0;
        let sampleFailTxCnt = 0;
        let sampleTotalRespTime = 0;    // includes succ and fail tx 
        let sampleAvgRespTime = 0;
        let sampleValidUserCnt = 0;     // has at least 1 succ tx
        
        // calculate tps in sampleewnt time sample
        sampleList.forEach(element => {
            if ( element[1] > 0 )
            {
                sampleValidUserCnt++;
                sampleTotalRespTime += element[3];   // response time
                sampleSuccTxCnt += element[1];
            }

            // get total failed tx count
            sampleFailTxCnt += element[2];
        });

        // get average response time in sample
        sampleAvgRespTime = sampleTotalRespTime / sampleSuccTxCnt;
        if ( !(sampleAvgRespTime > 0)) {
            sampleAvgRespTime = 0.0
        }

        // get tps in sample time frame.
        // sampleTps = sampleValidUserCnt * 1000 / sampleAvgRespTime;
        sampleTps = sampleSuccTxCnt * 1000 / intervalMs
        if ( !(sampleTps > 0)) {
            sampleTps = 0.0
        }

        // tps_max
        if (sampleTps > tps_max) {
            tps_max = sampleTps
        }

        resp_avg = Math.round(resp_total / trans_succ);

        // tps_avg
        if (resp_avg < 0.000001)
            tps_avg = 0.0
        else
            tps_avg = trans_succ * 1000 / elapseTime
        
        // block_maxTime
        if ( _sampleMaxBlockTime > block_maxTime )
            block_maxTime = _sampleMaxBlockTime;
        
        // block_maxTxCnt
        if ( _sampleMaxBlockTxCnt > block_maxTxCnt )
            block_maxTxCnt = _sampleMaxBlockTxCnt;

        // write sample record into file
        logRecord(`${elapseTime},${currUserCount},${sampleTps.toFixed(2)},`+
                   `${sampleAvgRespTime.toFixed(0)},` +
                   `${sampleSuccTxCnt},${sampleFailTxCnt},` + 
                   `${_sampleMaxBlockTime},${_sampleMaxBlockTxCnt}`)

        console.log('>>>>>>>>>>>>>>>>>>>>>')
        // console.log('elapseTime = %d', elapseTime)
        // console.log(`users injected = ${currUserCount}`)
        // console.log('users = %d, OK = %d, KO = %d', currUserCount, trans_succ, trans_fail);
        // console.log('resp_min = %d, resp_avg = %d, resp_max = %d', resp_min, resp_avg, resp_max)
        // console.log('tps_avg = %f, tps_max = %f', tps_avg.toFixed(2), tps_max.toFixed(2))
        // console.log(`block_maxTime = ${block_maxTime/1000}s, block_maxTxCnt = ${block_maxTxCnt}`)
        console.log('-------------- sample:')
        console.log('sampleValidUserCnt = ', sampleValidUserCnt)
        console.log('sampleSuccTxCnt = ' + sampleSuccTxCnt)
        console.log('sampleAvgRespTime = ' + sampleAvgRespTime.toFixed(2))
        console.log('sampleTps = %f', sampleTps)
        console.log('sampleMaxBlockTime = ', _sampleMaxBlockTime)
        console.log('sampleMaxBlockTxCnt = ', _sampleMaxBlockTxCnt)
        console.log('-------------- overall:')
        console.log('elapseTime = %d', elapseTime)
        console.log(`users injected = ${currUserCount}`)
        console.log('users = %d, OK = %d, KO = %d', currUserCount, trans_succ, trans_fail);
        console.log('resp_min = %d, resp_avg = %d, resp_max = %d', resp_min, resp_avg, resp_max)
        console.log('tps_avg = %f, tps_max = %f', tps_avg.toFixed(2), tps_max.toFixed(2))
        console.log(`block_maxTime = ${block_maxTime/1000}s, block_maxTxCnt = ${block_maxTxCnt}`)
        console.log('<<<<<<<<<<<<<<<<<<<<<')
    }
}

async function monitor() {
    elapseTime = 0;
    while (!bTestStop) {
        await sleep(1000)
        // console.log('elapseTime = ' + (elapseTime))
        elapseTime += 1000;
    }

    if (elapseTime >= totalRunTime) {
        bTestStop = true;
    }
}

async function injectUser(totalUserCount) {
    console.log('============> start to inject users')

    let asyncList = []; // 正在进行的所有并发异步操作
    let usersInject = 0;
    monitor();
    sample(2000);   // get informatin every interval

    // loop every second
    while (!bTestStop || (currUserCount < totalUserCount)) {
        let bAfterStepHold = false
        let bAfterFinalHold = false
        let currInjectUser = 0

        // usersInject += rampupRate;
        // if rampupRate = 0, inject all uses
        rampupRate <= 0 ? usersInject = totalUserCount : usersInject += rampupRate;
        currInjectUser = parseInt(usersInject);  // get user will be injected
        usersInject = usersInject % 1;          // get decimal, will be injected next time

        // inject users
        for (let i = 0; i < currInjectUser; i++) {
            let currUserId = userId++;          // get user id

            currUserCount++;
            asyncList.push(iterateTask(currUserId));     // inject user

            // final holding
            if (currUserCount >= totalUserCount ) {
                if (finalHoldTime > 0){
                    console.log('--------> final holding')
                    await sleep(finalHoldTime);
                }
                
                bTestStop = true;
                bAfterFinalHold = true;
            }

            // step holding
            if (!bAfterFinalHold && 
                stepUsers > 0 &&
                currUserCount > 0 &&
                (currUserCount % stepUsers == 0)) {

                console.log('--------> stepHoldTime = ',stepHoldTime)
                await sleep(stepHoldTime)
                bAfterStepHold = true
            }
        }

        // do not sleep after step holding
        if (!bAfterStepHold && !bAfterFinalHold)
            await sleep(1000)
    }

    
    // waiting 60s for the runing tx done
    for( let i = 0; i < 60; i++ )
    {
        // console.log('trans_done = ', trans_done)
        // console.log('trans_total = ', trans_total)
        if ( trans_done < trans_total )
            await sleep(1000);
        else
            break;
    }

    return Promise.all(asyncList);  // waiting for all transactions finish
}

async function loadTestData(){
    await loadTestAddress();
}

async function before() // before test run
{
    // create log file and add column title
    logRecord('time, user_count, tps, rpt, OK, KO, block_time, block_tx_cnt')

    // monitor the block
    await subscribeBlockTx()

    // start result chart server
    // startHttpServer()
}

async function after()  // after test done
{
    unsubscribeBlockTx()
    // await stopHttpServer()
    console.log('nonceList = ',nonceList[0]);
    process.exit(1);
}

//  =========================== parameters
// transaction details
var trans_total = 0;
var trans_done = 0;
var trans_succ = 0;
var trans_fail = 0;
// var currSuccTxCnt = 0;

// response time details. Only for succ transaction.
var resp_max = 0.0;
var resp_min = 9999.0;
var resp_avg = 0.0;
var resp_total = 0.0;
// var currTotalRespTime = 0.0;

// sample information list( contains 'userId, succ tx count, fail tx count, total response time')
var sample_list = [];

// tps details
var tps_max = 0.0;
var tps_avg = 0.0;

// block info
var block_maxTime = 0;
var block_maxTxCnt = 0;

// test status
var currUserCount = 0;
var elapseTime = 0;
var bTestStop = false;
var userId = 0;         // user id starts from 0

// user ramp-up
var isRunOnce = false;        // each user only run one tx, then exit
var totalUserCount = 0;
var pacingTime = 0;
var rampupRate = 0;         // users per second
var stepUsers = 0;          // inject the specified amount of users in each step
var stepHoldTime = 0;
var finalHoldTime = 0;      // runing time after inject all users
var totalRunTime = (stepUsers * 1000 / rampupRate + stepHoldTime) * (totalUserCount / stepUsers) + finalHoldTime;
// TODO: maybe a bug on totalRunTime when value = NaN

// ============ start test ============ //
function getArgs()
{
    const argv = require('yargs').argv;
    console.log(argv)
    
    if ( argv.user > 0 ) totalUserCount = argv.user;
    if ( argv.pacingtime > 0 ) pacingTime = argv.pacingtime * 1000;
    if ( argv.rampuprate > 0 ) rampupRate = argv.rampuprate;
    if ( argv.stepuser > 0 ) stepUsers = argv.stepuser;
    if ( argv.stepholdtime > 0 ) stepHoldTime = argv.stepholdtime * 1000;
    if ( argv.finalholdtime > 0 ) finalHoldTime = argv.finalholdtime * 1000;

    if ( argv.once ) {
        isRunOnce = true;
        stepUsers = 0;
        stepHoldTime = 0;
        finalHoldTime = 0;
    }

    if ( rampupRate > totalUserCount ) rampupRate = totalUserCount;
    if ( stepUsers > totalUserCount ) stepUsers = totalUserCount;
}

async function runTest()
{
    await getArgs();

    if ( totalUserCount <= 0 ) return

    await loadTestData();
    await before();
    // await init();
    // await sleep(5000);

    
    injectUser(totalUserCount).then( response => {
    
        console.log('finish')

        resp_avg = Math.round(resp_total / trans_succ);

        console.log('----- final statistics')
        console.log('test duration = %d(s)', (elapseTime/1000).toFixed(2))
        console.log(`users injected = ${currUserCount}`)
        console.log('users = %d, OK = %d, KO = %d', currUserCount, trans_succ, trans_fail);
        console.log('resp_min = %d, resp_avg = %d, resp_max = %d', resp_min, resp_avg, resp_max)
        console.log('tps_avg = %f, tps_max = %f', 
                    (trans_succ * 1000/elapseTime).toFixed(2), 
                    tps_max.toFixed(2))
        console.log(`block_maxTime = ${block_maxTime/1000}s, block_maxTxCnt = ${block_maxTxCnt}`)
        console.log('-------------------')

        after();
    });

}

// command: 
//      node src/run --user=13 --pacingtime=1 --rampuprate=1 --stepuser=5 --stepholdtime=60 --finalholdtime=600
// once: 
//      node src/run --user=90 --once
runTest();