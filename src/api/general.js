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


const logResultFlag = true

const fs = require('fs');

const recordFilePrefix = (new Date()).toJSON();

// Wait for specified time
function sleep(ms)
{
    if (ms < 0) ms = 0;
    return new Promise(resolve => setTimeout(resolve, ms))
}


function logRecord(str)
{
    let fileName = recordFilePrefix + ' - test_records';

    fs.appendFile(`result/${fileName}`, `${str}\n`,  (err)=> {
        if(err) console.log(err.message);
    });

    // fs.appendFile(`result/latestResult`, `${str}\n`,  (err)=> {
    //     if(err) console.log(err.message);
    // });
}

const resultDir = './result'
if (!fs.existsSync(resultDir)){
    fs.mkdirSync(resultDir)
}



module.exports.logRecord = logRecord
module.exports.sleep = sleep
module.exports.logResultFlag = logResultFlag

module.exports.CURRENCY = {
    STAKE:  16000,
    SPEND:  16001,
}
