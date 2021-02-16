"use strict";
const https = require('https');
const fs = require('fs');
const exp = require('express');
const cors = require('cors');

const app = exp();

const admin = require("firebase-admin");

const serviceAccount = require("./ssl/rosegamesonline-f6e17ffb137a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

const whitelist = ['https://137.112.40.92', 'http://137.112.40.92', 'https://rosegamesonline.web.app', 'http://rosegamesonline.web.app', 'https://rosegamesonline.web.app', 'http://rosegamesonline.web.app', 'https://rosegamesonline.firebaseapp.com', 'http://rosegamesonline.firebaseapp.com']
app.use(cors({ origin: whitelist, }))
//const canvas = require('canvas'); //This will be used to ensure anything sent via canvas() is valid, to prevent injection attacks

const privateKey = fs.readFileSync('./ssl/private.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/cert.pem', 'utf8');
const ca = fs.readFileSync('./ssl/ca_bundle.crt');

const credentials = { key: privateKey, ca: ca, cert: certificate };


function throwError(err) {
    return "Error: " + err;
}

class Node {
    parent = null
    children = []
    val = null
    isEnd = false
    constructor(v = null, p = null) {
        this.val = v;
        this.parent = p;
    }
}

class abcTree {
    root = new Node();

    constructor(v) {
        let j = JSON.parse(v);
        //console.log(j);
        let c = this.root;
        for (let b = 0; b < j.length; b++) {
            let w = j[b];
            //console.log("Adding " + w);
            for (let k of w) {
                let l = k.toLowerCase();
                let i = l.charCodeAt(0)
                if (c.children[i] == null) {
                    //console.log("Adding " + l + " after " + c.val);
                    c.children[i] = new Node(l, c);
                    //console.log(c.children[i]);
                }
                c = c.children[i];
            }
            c.isEnd = true;
            c = this.root;
        }
    }

    searchFor(str) {
        //console.log("Searching for " + str);
        let a = this.root;
        for (let c of str) {
            let l = c.toLowerCase();
            let i = l.charCodeAt(0)
            if (a.children[i] != null) {
                a = a.children[i];
            }
            else{
                //console.log("Dead end at " + c);
                return false;
            }
        }
        
        return a.isEnd;
    }
}

const bannedKeywords = new abcTree(fs.readFileSync("bannedKeywordsAndAPIs.json", 'utf-8'))//all banned keywords in NodeJS and web JS
const allowedKeywords = new abcTree(fs.readFileSync("allowedKeywords.json", 'utf-8'))

class codeScope {
    stack = [];
    lineNums = [];
    scopeVars = [];
    parent = null;
    currentLine = "";
    scopeInClass = false;
    isCanvas = false;
    constructor(parent) {
        this.parent = parent;
    }
    getLast() {
        if(!this.stack[this.stack.length - 1] instanceof codeScope){
            console.log("BAD getLast");
            return null;
        } 
        return this.stack[this.stack.length - 1];
    }

    push(val) {
        //let r = this.checkString()
        //if (!r) {
            this.stack.push(this.currentLine);
            this.currentLine = "";
            this.lineNums.push(val);
        //}
        //return r;
    }

    pushStack(val) {
        //let r = this.checkString()
        this.stack.push(new codeScope(this));
        this.lineNums.push(val);
    }

    toString(space = null) {
        let s = "";
        if (space != null) s = space;
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
    //for time's sake this will only check if there are no banned words. In the future, this would keep record of all user-made variables and mark any undeclared variables as well.
    checkString(i = null) {
        if (i == null) {
            for (let c = 0; c < this.stack.length; c++) {
                let r = this.checkString(c)
                if (r != null) return r;
            }
            return null;
        }
        else {
            let stuff = this.stack[i];
            if (stuff instanceof codeScope) {
                let r = stuff.checkString();
                if (r != null) return r;
                return null;
            }
            else {
                let s = stuff.replace(/(\s|\=|\,|\}|\;|\+|\-|\(|\)|\{|\!|\&|\*|\%|\^|\\|\/|\:|\[|\]|\<|\>|\?|\!|\"|\'|\`|\t|\n|\r||\||\.|\@|\~)+/g, "?"); //this matches every token in Javascript
                //console.log(s);
                s = s.replace(/\?\?/g, "!").replace(/\?/g, "");
                //console.log(s);
                s = s.split("!");
                //console.log(s);
                for (let w of s) {
                    //console.log("Checking for " + w)
                    if (bannedKeywords.searchFor(w)) {
                        return "Illegal word: '" + w + "' line " + this.lineNums[i];
                    }
                }
                return null;
            }
        }
    }
}

function checkCode(code) {
    //console.log("Checking code");
    //let c = code.replace(/[\r\n]+\n/g, ";").trim();


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
    
    for (let c of code.replace(/[ \t]+/g, " ").replace(/(^[ \t]+)|([ \t]+$)/gm, '')) { //2nd regex doesn't work...?
        //console.log(c);
        //console.log(currentStack);
        if (c == "\n" || c == "\r") lineNum++;

        //LET IT BE KNOWN, in order to use regex the format "let re = new RegExp('ab+c', 'i')" MUST be used, or else face the consequences or mysteriously running code!!!

        if (inComment == null) {
            if (inString.length == 0 && prevChar == "/" && (c == "/" || c == "*")) { //comment start
                
                inComment = c;
                currentStack.currentLine = currentStack.currentLine.substr(0, currentStack.currentLine.length - 1);
                //console.log("Comment  begin. c = " + c);
            }
            else if (inString.length == 0 || strParse) {
                if ((c == '"' || c == '`' || c == '\'') && !currentStack.parent.isCanvas) {//string start. Ignore canvas, which must be checked

                    inString.push(c);
                    strParse = false;
                }

                else if (currentStack.currentLine.length > 0 && (c == ";" || c == "\n" || c == "\r")) { //new line/code
                    currentStack.push(lineNum);
                    if (currentStack.isCanvas)
                        currentStack.isCanvas = false;
                }
                else if (c == '}' || c == ')') { //close stack/inline string end
                    
                    currentStack.push(lineNum);
                    currentStack = currentStack.parent;
                    if (currentStack.isCanvas)
                        currentStack.isCanvas = false;
                    if (strParse) strParse = false;
                }
                else if (c == '{' || c == '(') { //new stack start
                    if (currentStack.currentLine.indexOf("canvas") == 0)
                        currentStack.isCanvas = true;
                    currentStack.push(lineNum)
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
            else if (prevChar == "$" && c == "{" && inString == '`' && !currentStack.parent.isCanvas) { //special format string
                strParse = true;
                currentStack.pushStack(lineNum);
                currentStack = currentStack.getLast();
            }
            else if (inString != '`' && inString != null && (c == "\n" || c == "\r")) //newline in the middle of a string
                return throwError("Bad string: line " + lineNum);
        }
        else if ((prevChar == "*" && c == "/" && inComment == "*") || (inComment == "/" && (c == "\n" || c == "\r"))) { //end comment
            //console.log("comment end");
            if (inComment == "/"){
                currentStack.push(lineNum);
                
            }
            inComment = null;
        }
        else if(c == "\n" || c == "\r") console.log("newline in comment. inComment = " + inComment);
        //else console.log(c);

        prevChar = c;
    }
    return codeStack.checkString();
}

const server = https.createServer(credentials, app);
app.post('/verify-only', (request, response) => {
    //console.log('POST')
    var body = ''
    request.on('data', function (data) {
        body += data
        //console.log('Partial body: ' + body)
    })
    request.on('end', function () {
        if(!body){
            response.status(400).send();
            response.end();
        }
        else{
            //let r = decodeURIComponent(body.replace("code=", ""))
            let r = body;
            //console.log('Body: ' + r);
            //response.writeHead(200, { 'Content-Type': 'text/html' , 'X-Powered-By': 'None of your business', 'Response': '200'});
            let result = checkCode(r)
            response.status(200).send({ 'Content-Type': 'text/plain', 'X-Powered-By': 'None of your business', body: 'Result: ' + (result ? result.toString() : "SUCCESS")});
            response.end();
        }
    })
})

//TODO: saving
app.post('/save/:file', (request, response) => {
    //console.log('POST')
    var body = ''
    request.on('data', function (data) {
        body += data
        //console.log('Partial body: ' + body)
    })
    request.on('end', function () {
        if(!body){
            response.status(400).send();
            response.end();
        }
        else{
            //let r = decodeURIComponent(body.replace("code=", ""))
            let r = body;
            //console.log('Body: ' + r);
            //response.writeHead(200, { 'Content-Type': 'text/plain', 'X-Powered-By': 'None of your business', 'Response': '200'});
            let result = checkCode(r);
            if (!result) {
                fs.writeFileSync('./jsSourceFiles/' + request.params.file + ".js", r, { encoding: 'utf8', flag: 'w' })
            }
            response.status(200).send({ 'Content-Type': 'text/plain', 'X-Powered-By': 'None of your business', 'Response': '200', body: 'Result: ' + (result ? result : "SUCCESS")});
            response.end();
        }
    })
})

app.get('/code/:file', (request, response) => {
    //console.dir(request.param)

    //set header for POST and GET so there's no issues communicating with Firebase
    //response.setHeader('Access-Control-Allow-Origin', );
    //console.log('GET')
    if (request.params.file == null) {
        response.writeHead(400, {'X-Powered-By': 'None of your business', 'Response': '400' });
        response.end();
    }
    else if (request.headers['x-auth'] != null){
        let idToken = request.headers['x-auth'];
        admin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            
            const uid = decodedToken.uid;
            let doc = firestore.collection("GameMetadata").doc(request.params.file);
            let usr = firestore.collection("Users").doc(uid);
            doc.get().then(snap => {
                if(snap.exists){
                    if (!fs.existsSync('./jsSourceFiles/' + request.params.file + ".js")) {
                        response.writeHead(404, {'X-Powered-By': 'None of your business', 'Response': '404' });
                        response.end();
                    }
                    else if(snap.get("Author").path != usr.path){
                        response.writeHead(401, {'X-Powered-By': 'None of your business', 'Response': '401' });
                        response.end();
                    }
                    else{
                    //response.writeHead(200, )
                    //console.log("Sending code");
                    let r = String(fs.readFileSync('./jsSourceFiles/' + request.params.file + ".js"));
                    //console.log(r)
                    //response.status(200).send({ 'Content-Type': 'text/plain', 'X-Powered-By': 'None of your business', 'Response': '200', 'body': r});
                    //response.setHeader("Content-Type", "text/plain");
                    response.write(r, () => response.end());
                    }
                }
            });
            
            
        })
        .catch((error) => {
            console.log(error);
            response.writeHead(401, {'X-Powered-By': 'None of your business', 'Response': '401' });
            response.end();
        });
    } else{
        response.writeHead(401, {'X-Powered-By': 'None of your business', 'Response': '401' });
        response.end();
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
const host = '137.112.40.92';
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);