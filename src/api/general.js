

const fs = require('fs');

const recordFilePrefix = (new Date()).toJSON();

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
// try{
//     fs.unlinkSync('./result')
// }
// catch{
//     console.log("Cannot find folder 'result', create it...")
//     fs.mkdirSync('./result')
// }

// try{
//     fs.unlinkSync('result/latestResult')
// }
// catch{
//     console.log("Cannot find file 'latestResult'")
// }



global.sleep = sleep;
global.logRecord = logRecord;

// logRecord('hello')
// logRecord('hello2')