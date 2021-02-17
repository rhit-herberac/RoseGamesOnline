"use strict";
const { parentPort, workerData, resourceLimits, Worker, isMainThread } = require('worker_threads');

//workerData- unused???
//parentPort- Worker reference to parent thread
//worker- reference to workers map, so when connection closes, thread can be cleaned up

const fs = require('fs');

let msg = workerData;
let startGame = false;

//duplicate of class inputs from client-side gameServe.js, minus methods.
        //This is so that all input data can be sent at once and then retrieved server-side,
        //rather than adding delay to wait for a client response upon requesting input data.
        //plus: reduced delay
        //minus: continuous data sent from client, bigish data size
        //Note: gonna convert this to a sharedBufferArray for multithreading, brb
        class inputs {

            //ES6 has private fields now, this is how to declare them
            static #mousebtn = null;
            static #key = null;
            static #mousepos = null;
            static #input = null;

            static resetInputs(){
                for(let i = 0; i < inputs.#mousebtn.length; i++)
                    inputs.#mousebtn[i] = 0;
                for(let i = 0; i < inputs.#key.length; i++)
                    inputs.#key[i] = 0;
                for(let i = 0; i < inputs.#mousepos.length; i++)
                    inputs.#mousepos[i] = 0;
                for(let i = 0; i < inputs.#input.length; i++)
                    inputs.#input[i] = 0;

            }

            static _initialize(){
                let tmp = msg.buffers;
                inputs.#mousebtn = new Int8Array(tmp.mouseB);
                inputs.#key = new Int8Array(tmp.keyB);
                inputs.#mousepos = new Float64Array(tmp.mouseposB);
                inputs.#input = new Int8Array(tmp.inputB);
                inputs.resetInputs();
            }

            //inputB[4]
            static get hasFocus() {
                return inputs.#input[4] == 1 ? true : false;
            }

            static get mousePresses() {
                let temp = new Array();
                for(let i = 0; i < inputs.#mousebtn.length; i++)
                    if(inputs.#mousebtn[i] > 0)
                        temp.push(i);
                //console.log(temp);
                return temp;
            }

            //keyB
            static get keyPresses() {
                let temp = new Array();
                for(let i = 0; i < inputs.#key.length; i++)
                    if(inputs.#key[i] > 0)
                        temp.push(i);
                
                return temp;
            }

            //inputB[0]
            static get scrollX() {
                return inputs.#input[0];
            }

            //inputB[1]
            static get scrollY() {
                return inputs.#input[1];
            }

            //inputB[2]
            static get scrollZ() {
                return inputs.#input[2];
            }

            //inputB[3]
            static get scrollMode() {
                return inputs.#input[3];
            }

            //mouseposB[0]
            static get mouseX() {
                return inputs.#mousepos[0];
            }

            //mouseposB[1]
            static get mouseY() {
                return inputs.#mousepos[1];
            }
        }

if (isMainThread)
    console.error("Get this off main thread!!!");
else {

    //function to communicate to parent thread
    function _srvMsg(op, txt = "") {
        parentPort.postMessage(`${op} ${msg && msg.client ? msg.client : null} ${txt}`);
    }

    //gets source js filename if exists, or returns null
    function _getFile() {
        if (msg && msg.client && msg.file && fs.existsSync("./jsSourceFiles/" + msg.file + ".js"))
            return "./jsSourceFiles/" + msg.file + ".js";
        else return null;
    }

    //gets tmp js filename if exists, or returns null
    function _getTmpFile() {
        let newFile = "./jsTempFiles/" + msg.file + "-" + msg.client.replace(":", ".") + ".js";
        if (msg && msg.client && msg.file && fs.existsSync(newFile))
            return newFile;
        else return null;
    }

    //sanatizes strings to prevent SQL injection attacks. Only works for alert() because canvas() isn't handled as a string, but rather a canvas command.
    //Note: inline code like ${this} is checked in the verification process, like most of the rest of the code.
    function sanitize(cmd){
        let r = "";
        let prev = null;
        for (let c of String(cmd)){
            if(prev != "\\")
                if(c == "'" || c == "\"" || c == "`")
                    r = r + "\\";
            else if(c == "\\"){
                prev = null;
            }
            r = r + c;
        }
        return r;
    }

    try {
        //file contained within a Worker class. this=Worker

        function canvas(func) {
            //NOTE: VERIFICATION WILL HAVE TO ENSURE INJECTION ATTACKS DON'T HAPPEN WITH THIS CANVAS CALL!!!
            _srvMsg("send", "canvas canvas." + func + ";");
        }
        function alert(func) {
            //NOTE: VERIFICATION WILL HAVE TO ENSURE INJECTION ATTACKS DON'T HAPPEN WITH THIS CANVAS CALL!!!
            _srvMsg("send", "alert alert(\"" + sanitize(func) + "\");");
        }

        function end() {
            inputs.resetInputs();
            _srvMsg("terminate");
        }

        function cursor(val) {
            _srvMsg("cursor", val);
        }

        function getInputs() {
            return inputs;
        }

        function debug(val){
            _srvMsg("debug", val);
        }

        //creates temporary js file to enable client to play game
        function _makeFile() {
            _srvMsg("load");

            if (_getFile()) {
                let newFile = "./jsTempFiles/" + msg.file + "-" + msg.client.replace(":", ".") + ".js";
                let srcFile = "./jsSourceFiles/" + msg.file + ".js";
                if (fs.existsSync(newFile)) fs.rmSync(newFile);
                fs.copyFileSync("./gameTemplate.js", newFile);
                let src = fs.readFileSync(srcFile);
                let temp = fs.readFileSync(newFile);
                temp = String(temp).replace(/\/\/CODEREPLACE/g, src);
                fs.writeFileSync(newFile, temp, function (err) { if (err) _srvMsg("error", err); });
                _srvMsg("ready", msg.client);
                return newFile;
            }
            else _srvMsg("error", "badSetup");
            return null;
        }



        //runs game if temporary file is properly made
        async function _runGame(game) {
            if (game) {
                let g = require(game);
                if (g) {
                    inputs.resetInputs();
                    g.run(canvas, alert, cursor, getInputs, end, debug);
                    //inputs.resetInputs();
                } else _srvMsg("error", "noFile");
            } else _srvMsg("error", "noLoad");
        }

        //thread-thread only
        //Note on threads: whenever a game is running, it is running in the same Worker thread.
        //If there's a loop, it WILL prevent onmessage from being called.
        //Here's to no more thread-safe communication?
        parentPort.onmessage = (m) => {
            let temp = m.data;

            if (temp.client) {
                if (!msg)
                    msg = { client: null, file: null };
                msg.client = temp.client;
                msg.file = temp.file;
                msg.buffers = temp.buffers;
                inputs._initialize();
                //_srvMsg("msg", temp);
            }
            else {
                let t = temp.split(" ");
                let v = t.slice(1, t.length);
                //_srvMsg("msg", temp);
                switch (t[0]) {
                    case "restart": case "run":
                        _runGame(_makeFile());
                        break;
                    case "delete":
                        let f = _getTmpFile();
                        if (f)
                            fs.rmSync(f);
                        _srvMsg("delete");
                        break;
                }
            }
            //console.log("message end");
        }

        //_srvMsg("msg",  "new thread ready.");

    }
    catch (e) {
        console.log(e);
        end();
    }
}