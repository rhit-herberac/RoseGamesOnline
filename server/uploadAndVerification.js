"use strict";
const http = require('http');
const fs = require('fs');
//const canvas = require('canvas'); //This will be used to ensure anything sent via canvas() is valid, to prevent injection attacks

function throwError(err) {
    console.log("This is a temporary error check. Error: " + err);
}

class codeScope {
    stack = [];
    lineNums = [];
    scopeVars = [];
    parent = null;
    currentLine = "";
    scopeInClass = false;
    constructor(parent) {
        this.parent = parent;
    }
    getLast() {
        return this.stack[this.stack.length - 1];
    }

    push(val) {
        if(this.checkString()){
            this.stack.push(this.currentLine);
            this.currentLine = "";
            this.lineNums.push(val);
        }
    }

    pushStack(val) {
        if(this.checkString()){
            this.stack.push(new codeScope(this));
            this.lineNums.push(val);
        }
    }

    toString(space = null) {
        let s = "";
        if(space != null) s = space;
        let r = "";
        for (let l of this.stack) {
            if (l instanceof codeScope) {
                r += s + l.toString(s + " ");
            }
            else r += s + l + ";\n";
        }
        return s + r + ";\n";
    }

    //returns true if currentLine has all valid names/types/etc
    checkString(){
        let stuff = this.currentLine.split(/(\s|=|,|}|;|\+|-|\(|\)|{|!|\&|\*|%|\\|\/|:|\[|\]|<|>|\?|"|'|`|\t|\n|\r|)+/g); //this matches every token in Javascript
    }
}

function checkCode(code) {
    console.log("Checking code");
    //let c = code.replace(/[\r\n]+\n/g, ";").trim();

    const bannedKeywords = ["require", "exports", "console", "_time", "document", "window", "_mousepos", "_key", "_mousebtn", "_input", "_srvMsg", "_initialize"] //all banned keywords in NodeJS and web JS
    const allowedKeywords = ["alert", "canvas", "time", "cursor", "inputs", "end", "debug", "Math", "RegExp"]
    //first step is to reconstruct code into codeStack
    let prevChar = null;
    let inString = [];
    let CSIndex = 0;
    let lineNum = 0;
    let inComment = null;
    let strParse = false;
    let currentStack = new codeScope(null);
    let codeStack = currentStack; //represents all user code, wrapped in functions and ifs if necessary
    let escapeChar = false;
    for (let c of code.trim().replace(/[\s+^\n+\r]/g, " ").replace(/(^\s+)|(\s+$)/gm, "")) { //2nd regex doesn't work...?
        //console.log(currentStack);
        if (c == "\n" || c == "\r") lineNum++;

        //LET IT BE KNOWN, in order to use regex the format "let re = new RegExp('ab+c', 'i')" MUST be used, or else face the consequences or mysteriously running code!!!

        if (inComment == null) {
            if (inString.length == 0 && prevChar == "/" && (c == "/" || c == "*")) { //comment start
                console.log("Comment  begin");
                inComment = c;
                currentStack.currentLine = currentStack.currentLine.substr(0, currentStack.currentLine.length-1);
            }
            else if (inString.length == 0 || strParse) {
                if (c == '"' || c == '`' || c == '\'') {//string start

                    inString.push(c);
                    strParse = false;
                }
                else if (currentStack.currentLine.length > 0 && (c == ";" || c == "\n" || c == "\r")) { //new line/code
                    currentStack.push(lineNum);
                }
                else if(c == '}'){ //close stack/inline string end
                    currentStack.push(lineNum);
                    currentStack = currentStack.parent;
                    if(strParse) strParse = false;
                }
                else if(c == '{'){ //new stack start
                    currentStack.push(lineNum);
                    currentStack.pushStack(lineNum);
                    currentStack = currentStack.getLast();
                }
                else currentStack.currentLine = currentStack.currentLine + c;
            }
            else if (c == "\\" && !ignoreNextChar) ignoreNextChar = true; //escape char in string
            else if (prevChar != '\\' && inString == c) { //close string
                inString.pop();
                if (inString.length > 0) strParse = true;
            }
            else if (prevChar == "$" && c == "{" && inString == '`') { //special format string
                strParse = true;
                currentStack.pushStack(lineNum);
                currentStack = currentStack.getLast();
            }
            else if (inString != '`' && inString != null && (c == "\n" || c == "\r")) //newline in the middle of a string
                throwError("bad string");
        }
        else if ((prevChar == "*" && c == "/" && inComment == "*") || (inComment == "/" && (c == "\n" || c == "\r"))){ //end comment
            if(inComment == "/") currentStack.push(lineNum);
            inComment = null;
            console.log("Ending comment");
        }
        else if(c == "\n" || c == "\r") console.log("newline");

        prevChar = c;
    }
    return codeStack;
}

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
            let r = decodeURIComponent(body.replace(/\+/g, ' ').replace("code=", ""))
            console.log('Body: ' + r);
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end('Result: \n' + checkCode(r).toString());
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
                      <form id="f" method="post" onsubmit="textTrim()" action="http://${host}:${port}" > 
                          
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
const host = 'rosegamesonline.csse.rose-hulman.edu';
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);