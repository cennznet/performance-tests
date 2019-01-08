

const fs = require('fs');

const recordFilePrefix = (new Date()).toJSON();

function sleep(ms)
{
    if (ms < 0) ms = 0;
    return new Promise(resolve => setTimeout(resolve, ms))
}


function logRecord(str)
{
    let fileName = recordFilePrefix + ' - test_Records';

    fs.appendFile(`result/${fileName}`, `${str}\n`,  (err)=> {
        if(err) console.log(err.message);
    });

    fs.appendFile(`result/latestResult`, `${str}\n`,  (err)=> {
        if(err) console.log(err.message);
    });
}

try{
    fs.unlinkSync('result/latestResult')
}
catch{
    // console.log("Cannot find file 'latestResult'")
}



global.sleep = sleep;
global.logRecord = logRecord;

// logRecord('hello')
// logRecord('hello2')