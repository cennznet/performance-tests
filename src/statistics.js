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

const {sleep} = require('./api/general')
const {logResultFlag, logRecord} = require('./api/general')

var currBlockId = 0

module.exports = {
    testStartTime:  0,
    testEndTime:    0,

    // transaction details
    trans_total:    0,
    trans_done:     0,
    trans_succ:     0,
    trans_fail:     0,
    //currSuccTxCnt: 0,

    // response time details. Only for succ transaction.
    resp_max:   0.0,
    resp_min:   0.0,
    resp_avg:   0.0,
    resp_total: 0.0,
    //currTotalRespTime: 0.0,

    // sample information list( contains 'userId, succ tx count, fail tx count, total response time')
    sample_list:            [],
    sampleMaxBlockTime:     0,
    sampleMaxBlockTxCnt:    0,

    // tps details
    tps_max:    0.0,
    tps_avg:    0.0,

    // block info
    blockId:            0,
    block_maxTime:      0,
    block_maxTxCnt:     0,

    // test status
    currUserCount:  0,
    elapseTime:     0,
    bTestStop:      false,


    addTxResultToStatistics: function(userId, isTxPassed, responseTime)
    {
        let bSucc = isTxPassed;
        // let message = txResult.message;
        let sameUserIdIndex = -1;

        let sampleSuccCnt = 0;
        let sampleFailCnt = 0;

        // total tx count
        // this.trans_total++;

        if (bSucc) // succ
        {
            // total succ tx
            this.trans_succ++;
            sampleSuccCnt++;

            this.resp_total += responseTime;
            // resp_avg = Math.round(resp_total / trans_succ);

            if (responseTime > this.resp_max)    // get resp_max
                this.resp_max = responseTime;
            if (this.resp_min < 0.001 || responseTime < this.resp_min)   // get resp_min
                this.resp_min = responseTime;

        }
        else  // failed
        {
            this.trans_fail++;
            sampleFailCnt++;
        }

        // ---- add tx result into sample list
        // get index of same user in the smaple list
        sameUserIdIndex = this.sample_list.findIndex(element => {
            return element[0] == userId;
        })

        if (sameUserIdIndex < 0) {// no same user, add a new element
            this.sample_list.push([userId, sampleSuccCnt, sampleFailCnt, responseTime])
        }
        else {// same user, add into existing data
            this.sample_list[sameUserIdIndex][1] += sampleSuccCnt;   // total succ count tx
            this.sample_list[sameUserIdIndex][2] += sampleFailCnt;   // total fail count tx
            this.sample_list[sameUserIdIndex][3] += responseTime;    // total response time including succ and fail tx
        }
    },

    showSampleStatistics: async function(intervalMs) {
    
        while (!this.bTestStop) 
        {
            await sleep(intervalMs)
    
            // copy sample content list
            let sampleList = this.sample_list.slice(); 
            // clear global list  
            this.sample_list = [];
    
            // get block info
            let _sampleMaxBlockTime = this.sampleMaxBlockTime
            let _sampleMaxBlockTxCnt = this.sampleMaxBlockTxCnt
            // reset original value to collect next time frame
            this.sampleMaxBlockTime = 0; 
            this.sampleMaxBlockTxCnt = 0;
    
            // define local metrics
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
            if (sampleTps > this.tps_max) {
                this.tps_max = sampleTps
            }
    
            this.resp_avg = Math.round(this.resp_total / this.trans_succ);
    
            // tps_avg
            if (this.resp_avg < 0.000001)
                tps_avg = 0.0
            else{
                let totalTimeElapse = Date.now() - this.testStartTime
                this.tps_avg = this.trans_succ * 1000 / totalTimeElapse
            }
                
            // block_maxTime
            if ( _sampleMaxBlockTime > this.block_maxTime )
                this.block_maxTime = _sampleMaxBlockTime;
            
            // block_maxTxCnt
            if ( _sampleMaxBlockTxCnt > this.block_maxTxCnt )
                this.block_maxTxCnt = _sampleMaxBlockTxCnt;
    
            // write sample record into file
            if (logResultFlag){
                logRecord(`${this.elapseTime},${this.currUserCount},${sampleTps.toFixed(2)},`+
                       `${sampleAvgRespTime.toFixed(0)},` +
                       `${sampleSuccTxCnt},${sampleFailTxCnt},` + 
                       `${_sampleMaxBlockTime},${_sampleMaxBlockTxCnt}`)
            }
    
            console.log('>>>>>>>>>>>>>>>>>>>>>')
            console.log('current time = ', new Date().toLocaleString())
            console.log('-------------- Sample:')
            console.log('sampleValidUserCnt = ', sampleValidUserCnt)
            console.log('sampleSuccTxCnt = ' + sampleSuccTxCnt)
            console.log('sampleAvgRespTime = ' + sampleAvgRespTime.toFixed(2))
            console.log('sampleTps = %f', sampleTps)
            console.log('sampleMaxBlockTime = ', _sampleMaxBlockTime)
            console.log('sampleMaxBlockTxCnt = ', _sampleMaxBlockTxCnt)
            console.log('-------------- Overall:')
            console.log('elapseTime = %d', this.elapseTime)
            console.log(`users injected = ${this.currUserCount}`)
            console.log('users = %d, OK = %d, KO = %d', this.currUserCount, this.trans_succ, this.trans_fail);
            console.log('total tx = %d, tx done = %d', this.trans_total, this.trans_done);
            console.log('resp_min = %d, resp_avg = %d, resp_max = %d', this.resp_min, this.resp_avg, this.resp_max)
            console.log('tps_avg = %f, tps_max = %f', this.tps_avg.toFixed(2), this.tps_max.toFixed(2))
            console.log(`block_maxTime = ${this.block_maxTime/1000}s, block_maxTxCnt = ${this.block_maxTxCnt}`)
            console.log('<<<<<<<<<<<<<<<<<<<<<')
        }
    },

    showFinalStatistics: function(runOnlyOnce){
        console.log('Test finished')

        this.resp_avg = Math.round(this.resp_total / this.trans_succ);

        console.log('----- Final Statistics -----')
        console.log('test duration = %d(s)', (this.elapseTime/1000).toFixed(2))
        console.log(`users injected = ${this.currUserCount}`)
        console.log('OK = %d, KO = %d', this.trans_succ, this.trans_fail);
        console.log('total tx = %d, tx done = %d', this.trans_total, this.trans_done);
        if ( !runOnlyOnce ){
            console.log('resp_min = %d, resp_avg = %d, resp_max = %d', this.resp_min, this.resp_avg, this.resp_max)
            console.log('tps_avg = %f, tps_max = %f', 
                        (this.trans_succ * 1000/this.elapseTime).toFixed(2), 
                        this.tps_max.toFixed(2))
            console.log(`block_maxTime = ${this.block_maxTime/1000}s, block_maxTxCnt = ${this.block_maxTxCnt}`)
        }
        console.log(`Total tx sent: ${this.totalTx}`)
        console.log('----------------------------')
    },
}