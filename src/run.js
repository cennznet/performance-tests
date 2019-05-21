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

"use strict"

const { logRecord, sleep } = require('./api/general')
const parameter = require('./parameter');
const { apiPool } = require('./api/transactions')
const topupAll = require('../tools/topup')
const { Action } = require('./action')
const statistics = require('./statistics')
const monitor = require('./monitor')

/**
 * Execute all functions in class Action. 
 * - Functions will be ignored if the name starts with '_'
 * - constructor() will be ignored
 */
async function callUserScenario(userId, iterationNum){
    
    // create action instance
    let action = new Action()
    action.userId = userId
    action.iterationNum = iterationNum

    // get all functions' name
    const funcNameLst = Object.getOwnPropertyNames(Action.prototype)

    for (let i = 0; i < funcNameLst.length; i++){
        let funcName = funcNameLst[i]
        if ( funcName == 'constructor' || funcName[0] == '_' ){
            // pass
        }
        else{
            // invoke the function
            await action[funcName]()
        }
    }
}

async function iterateTask(userId) {
    // console.log('userId %d starts task', userId)

    if (isRunOnce) {
        await callUserScenario(userId)
    }
    else {
        let loopCount = 0
        while (!statistics.bTestStop) {
            await callUserScenario(userId, loopCount++)
            await sleep(pacingTime);
            // if (isRunOnce) statistics.bTestStop = true; // for once run, exit user
        }
    }
}

async function startMonitor() {
    console.log('Start test monitor...')
    statistics.elapseTime = 0;
    while (!statistics.bTestStop) {
        await sleep(1000)
        // console.log('elapseTime = ' + (elapseTime))
        statistics.elapseTime += 1000;
    }

    if (statistics.elapseTime >= totalRunTime) {
        statistics.bTestStop = true;
    }
}

async function injectUser(totalUserCount) {
    console.log('============> start to inject users')

    let asyncList = []; // all async actions
    let usersInject = 0;
    // monitor();
    // statistics.showSampleStatistics(2000) // get sample informatin every interval

    statistics.testStartTime = Date.now()

    // loop every second
    while (!statistics.bTestStop || (statistics.currUserCount < totalUserCount)) {
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

            statistics.currUserCount++;
            asyncList.push(iterateTask(currUserId));     // inject user

            // final holding
            if (statistics.currUserCount >= totalUserCount ) {
                if (finalHoldTime > 0){
                    console.log('--------> final holding')
                    await sleep(finalHoldTime);
                }
                
                statistics.bTestStop = true;
                bAfterFinalHold = true;
            }

            // step holding
            if (!bAfterFinalHold && 
                stairUsers > 0 &&
                statistics.currUserCount > 0 &&
                (statistics.currUserCount % stairUsers == 0) &&
                (statistics.currUserCount >= startUserCount)) {    // for the 'startUserCount' users, don't hold

                console.log('--------> stairHoldTime = ',stairHoldTime)
                await sleep(stairHoldTime)
                bAfterStepHold = true
            }
        }

        // do not sleep after step holding
        if (!bAfterStepHold && !bAfterFinalHold && 
            (statistics.currUserCount >= startUserCount) )  // for the 'startUserCount' users, don't sleep
            await sleep(1000)
    }

    
    // waiting 60s for the runing tx done
    for( let i = 0; i < 60; i++ )
    {
        // console.log('trans_done = ', trans_done)
        // console.log('trans_total = ', trans_total)
        if ( statistics.trans_done < statistics.trans_total )
            await sleep(1000);
        else
            break;
    }

    testEndTime = Date.now()

    return Promise.all(asyncList);  // waiting for all transactions finish
}

async function loadTestData(){
    console.log('Load test addresses...')
    await parameter.loadTestAddress();
}

async function before() // before test run
{
    startMonitor();

    // create log file and add column title
    logRecord('time, user_count, tps, rpt, OK, KO, block_time, block_tx_cnt')
    
    if ( !isRunOnce ){
        // start sampler
        statistics.showSampleStatistics(2000);
        // monitor the block
        await monitor.subscribeBlockTx();
    }
        
    // start result chart server
    // startHttpServer()
}

function after()  // after test done
{
    if ( !isRunOnce )
        monitor.unsubscribeBlockTx()
    // await stopHttpServer()
    // console.log('nonceList = ',nonceList[0]);
    process.exit();
}

//  =========================== parameters
var userId = 0;             // user id starts from 0

// user ramp-up
var isRunOnce = false;      // each user only run one tx, then exit
var totalUserCount = 0;
var startUserCount = 0;
var pacingTime = 0;
var rampupRate = 0;         // users per second
var stairUsers = 0;         // inject the specified amount of users in each step
var stairHoldTime = 0;
var finalHoldTime = 0;      // runing time after inject all users
var totalRunTime = 0;       // TODO: maybe a bug on totalRunTime when value = NaN

// ============ start test ============ //
async function getArgs()
{
    console.log('Anaylyse input peremeters...')
    const argv = require('yargs').argv;
    console.log(argv)

    // only top up addresses
    if ( argv.topup ){
        await topupAll()
        process.exit()
    }
    
    // argv.ws ? global.wsIp = argv.ws : global.wsIp = 'ws://127.0.0.1:9944';
    argv.ws ? await apiPool.addWsIp(argv.ws) : await apiPool.addWsIp( 'ws://127.0.0.1:9944');
    if ( argv.nodeSelect )          apiPool.setApiSelectMethod(argv.nodeSelect)
    if ( argv.user > 0 )            totalUserCount  = argv.user;
    if ( argv.startuser > 0 )       startUserCount  = argv.startuser;
    if ( argv.pacingtime > 0 )      pacingTime      = argv.pacingtime * 1000;
    if ( argv.rampuprate > 0 )      rampupRate      = argv.rampuprate;
    if ( argv.stairuser > 0 )       stairUsers      = argv.stairuser;
    if ( argv.stairholdtime > 0 )   stairHoldTime   = argv.stairholdtime * 1000;
    if ( argv.finalholdtime > 0 )   finalHoldTime   = argv.finalholdtime * 1000;

    if ( argv.once ) {
        isRunOnce = true;
        stairUsers = 0;
        stairHoldTime = 0;
        finalHoldTime = 0;
    }

    if ( rampupRate > totalUserCount ) rampupRate = totalUserCount;
    if ( stairUsers > totalUserCount ) stairUsers = totalUserCount;

    totalRunTime = (stairUsers * 1000 / rampupRate + stairHoldTime) * ( totalUserCount / stairUsers) + finalHoldTime;
}

async function runTest()
{
    await getArgs();
    // console.log('runTest...')
    if ( totalUserCount <= 0 ) {
        console.log('Bad command: Need user count.')
        process.exit(1)
        return
    }

    await loadTestData();
    await before();
    // await init();
    // await sleep(5000);

    injectUser(totalUserCount).then( response => {

        statistics.showFinalStatistics(isRunOnce)

        after();
    });

}

// command: 
//      node src/run --user=13 --startuser=10 --pacingtime=1 --rampuprate=1 --stairuser=5 --stairholdtime=60 --finalholdtime=600 --ws=ws://127.0.0.1:9944 --nodeSelect=random
// once: 
//      node src/run --ws=ws://127.0.0.1:9944 --once --user=10
//      node src/run --ws=ws://docker.for.mac.localhost:9944 --once --user=10 
runTest();
