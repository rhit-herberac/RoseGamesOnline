"use strict";
const http = require('http');
const fs = require('fs');

const server = http.createServer(function (request, response) {
    console.dir(request.param)

    if (request.method == 'POST') {
        console.log('POST')
        var body = ''
        request.on('data', function (data) {
            body += data
            console.log('Partial body: ' + body)
        })
        request.on('end', function () {
            console.log('Body: ' + decodeURI(body))
            response.writeHead(200, { 'Content-Type': 'text/html' })
            response.end('post received')
        })
    } else {
        console.log('GET')
        var html = `
              <html>
              <head>
              </head>
                  <body>
                  <script> function textTrim(){
                  let o = document.getElementById('c').value;
                  console.log(o);
                  o = encodeURI(o);
                  console.log(o);
              }</script>
                        <textarea id="c" type="text" name="code" form="f"></textarea>
                      <form id="f" method="post" onsubmit="textTrim()" action="http://137.112.137.213:3000" > 
                          
                          <input type="submit" value="Submit" />
                      </form>
                  </body>
              </html>`
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(html)
    }
})

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log("Server close");
        server.close();
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

const port = 3000;
const host = '137.112.137.213';
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);