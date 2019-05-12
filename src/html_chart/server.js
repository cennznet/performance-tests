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

global.startHttpServer = startHttpServer;
global.stopHttpServer = stopHttpServer;

var app = require('http').createServer(handler),
    io = require('./node_modules/socket.io').listen(app),
    fs = require('fs');
//当前在线人数
var onlineCount = 0;
 
function handler (req, res) {
 
    fs.readFile(__dirname + '/result_chart.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
 
            res.writeHead(200);
            res.end(data);
        });
}

function loadLatestResultFile() {
    let filePath = getLatestResultFilePath();

    let _fs = require('fs');

    let data = _fs.readFileSync(filePath, "utf-8");

    let resultData = data.trim().split(/\r?\n/ig);   // split into lines

    let resultList = [];

    // v is value, i is index key
    resultData.forEach(function (v, i) {
        let resultLine = v.split(',')
        resultLine.forEach( function (v, j){
            if ( i > 0 )
            {
                if (j == 0){
                    resultLine[j] = convertSecondToTime(v)
                }
                else
                    resultLine[j] = parseFloat(v);
            }

        });
        resultList.push(resultLine);
    });

    return resultList;
}

function convertSecondToTime(ms)
{
    let seconds = ms / 1000
    let time = ''
    let h = '',
        m = '',
        s = '';
    
    h = `${Math.floor(seconds / 3600)}`
    if (h.length == 1) h = `0${h}`

    m = `${Math.floor( (seconds % 3600) / 60 )}`
    if (m.length == 1) m = `0${m}`

    s = `${Math.floor(seconds % 60)}`
    if (s.length == 1) s = `0${s}`

    time = `${h}:${m}:${s}`;

    return time
}

function getLatestResultFilePath() {
    return __dirname + '/../../result/latestResult'
}

//连接事件
io.sockets.on('connection', function (socket) {
 
    // console.log('有新用户进入...');
    //叠加当前在线人数
    onlineCount++;

    let bSent = false;
 
    var tweets = setInterval(function () {
            let data = loadLatestResultFile()
            if (!bSent)
            {
                socket.volatile.emit('onlinenums', data); // call client callback fun every second
                bSent = true;
            }
    }, 1000);
    // socket.volatile.emit('onlinenums', 'hello');
 
    // console.log('当前用户数量:'+onlineCount);
    //客户端断开连接
    socket.on('disconnect', function() {
 
        if(onlineCount > 0 ){
            //当前在线用户减一
            onlineCount--;
            // console.log('当前用户数量:'+onlineCount);
        }
    });
});
 
//start HTTP server ，use port 3000
function startHttpServer()
{
    app.listen(3000, function(){
        // console.log('Chart server started (listening on port:3000)');
    });
}

function stopHttpServer()
{
    app.close().on('close', () => console.log('Chart server stopped'))
}

// test code
startHttpServer()

// console.log(loadLatestResultFile())