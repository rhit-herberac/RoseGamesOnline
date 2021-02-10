"use strict";
const fs = require('fs');
const serverConfig = JSON.parse(fs.readFileSync('wsConfig.json'));
const ws = require('ws');
const wss = new ws.Server(serverConfig);
const { Worker } = require('worker_threads');

let workers = new Map();
//This is assuming all verification has been performed on the file which the user wants to run. Therefore the user will have NO access to server-side code

var privateKey = fs.readFileSync('key.pem', 'utf8');
var certificate = fs.readFileSync('cert.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
var https = require('https');

function arrToStr(arr, start) {
  let r = "";
  let a = start;
  for (; a < arr.length - 1; a++)
    r += arr[a] + " ";
  r += arr[a];
  return r;
}

//stops and cleans up a thread
function stopAndTerminate(id) {
  //console.log("Stopping and cleaning up " + id);
  if (workers.get(id).worker)
    workers.get(id).worker.terminate();
  workers.get(id).client.send("stop");

}

//thread-thread communication
//structure: "[message] [ID=ipaddress] [additionalData]", where [message] is task to run (terminate, send)
function workerMessage(e) {
  //console.log("Message from thread: " + e);
  let i = String(e).split(" ");
  let g = workers.get(i[1]);
  if (g)
    switch (i[0]) {
      case "terminate":
        stopAndTerminate(i[1], arrToStr(i, 2));
        break;
      case "delete":
        if (!workers.get(i[1]).client.isAlive) {
          console.log("Deleting worker " + i[1]);
          workers.get(i[1]).worker.terminate();
          if (workers.get(i[1]).file) {
            let newFile = "./jsTempFiles/" + workers.get(i[1]).file + "-" + (i[1]).replace(":", ".") + ".js";
            fs.rmSync(newFile);
          }
          workers.delete(i[1]);
        }
        break;
      case "send":
        //server-client message structure: either "ID [ID=ipaddress]"" for initialization, or "[message]", where [message] is evaled on client
        //console.log("Sending '" + r + "' to client " + i[1]);
        g.client.send(arrToStr(i, 2));
        break;
      case "ready":
        g.client.send("ready");
        break;
      case "load":
        g.client.send("load");
        break;
      case "cursor":
        g.client.send("cursor " + arrToStr(i, 2));
        break;
      case "error":
        g.client.send("error" + arrToStr(i, 2));
        stopAndTerminate(i[1], arrToStr(i, 2));
        console.log("Error");
      case "msg":
        console.log(i[1] + ": " + arrToStr(i, 1));
        break;
      case "debug":
        g.client.send("debug " + arrToStr(i, 2));
        break;
      default:
        console.log(e);
    }
  else console.log("Bad ID: " + i[1] + ". Message from worker: " + e);

}

//server-client communication
//message structure (from client): "[ID=ipaddress] [message] [additionalData]", where [message] is task to run (start, stop, onInput...)
function onMessage(txt) {
  let list = String(txt).split(" ");
  let g = workers.get(list[0]);
  if (g)
    switch (list[1]) {
      case "start":
        if (!g.worker) {
          g.file = arrToStr(list, 2);
          console.log("Starting game on worker " + list[0]);
        }
        else {
          g.worker.terminate();

        }
        g.worker = new Worker('./worker.js', { workerData: { file: arrToStr(list, 2), client: list[0], buffers: g.buffers }, resourceLimits: { maxYoungGenerationSizeMb: 5, maxOldGnerationSizeMb: 10, codeRangeSizeMb: 5, stackSizeMb: 5 } });
        g.worker.on('message', workerMessage);
        g.worker.postMessage({ file: arrToStr(list, 2), client: list[0], buffers: g.buffers });
        g.worker.postMessage("run");
        break;
      case "stop":
        stopAndTerminate(list[0], arrToStr(list, 2));
        break;
      case "mousebtns":
        //console.log(list);
        for (let i = 0; i < g.arrays.mousebtn.length; i++) {
          let changed = false;
          //if (list.length - 2 > 0)
            for (let j = 2; j < list.length; j++)
              if (list[j].length > 0 && list[j] == i) {
                g.arrays.mousebtn[i] = 1;
                //
                changed = true;
              }
          if (!changed) g.arrays.mousebtn[i] = 0;
        }
        //console.log(g.arrays.mousebtn);

        break;
      case "scrollwheel":
        g.arrays.input[0] = list[0];
        g.arrays.input[1] = list[1];
        g.arrays.input[2] = list[2];
        g.arrays.input[3] = list[3];
        break;
      case "keys":
        for (let i = 0; i < g.arrays.key.length; i++) {
          let changed = false;
          for (let j = 2; j < list.length; j++)
            if (list[j].length > 0 && list[j] == i) {
              g.arrays.key[i] = 1;
              changed = true;
            }
          if (!changed) g.arrays.key[i] = 0;
        }

        break;
      case "mousepos":
        g.arrays.mousepos[0] = list[2];
        g.arrays.mousepos[1] = list[3];
        break;
      case "focus":
        g.arrays.input[4] = (list[2] == "true" ? 1 : 0);
        break;
      default:
        console.log(txt);
    }
  else console.log("Bad ID: " + list[0] + ". Message from client: " + txt);
}


wss.on('connection', function connection(ws, req) {

  ws.isAlive = true;
  let val = 0;
  while (workers.get(req.socket.remoteAddress + "_" + val))
    val++;
  const ID = req.socket.remoteAddress + "_" + val;
  workers.set(ID, {
    client: ws, worker: null, file: null,
    buffers: { mouseB: new SharedArrayBuffer(5), keyB: new SharedArrayBuffer(256), mouseposB: new SharedArrayBuffer(16), inputB: new SharedArrayBuffer(5) },
    arrays: {}
  });
  let temp = workers.get(ID).buffers;
  workers.get(ID).arrays = { mousebtn: new Int8Array(temp.mouseB), key: new Int8Array(temp.keyB), mousepos: new Float64Array(temp.mouseposB), input: new Int8Array(temp.inputB) }
  //console.log(workers.get(ID).worker);

  ws.send("ID " + ID);

  ws.on('message', onMessage.bind(this));
  ws.on('close', function (code, reason) {
    console.log("Client " + ID + " DC. Code: " + code + "; Reason: " + reason);
    ws.isAlive = false;
    if (workers.get(ID).worker) {
      console.log("Deleting worker " + ID);
      workers.get(ID).worker.terminate();
      if (workers.get(ID).file) {
        let newFile = "./jsTempFiles/" + workers.get(ID).file + "-" + (ID).replace(":", ".") + ".js";
        fs.rmSync(newFile);
      }
      workers.delete(ID);
    }

  });
  ws.on('error', function (error) { console.log("Client error: " + error); })
});

function close(v) {

  process.exit(v);
}

wss.on('close', process.exit);

function exitHandler(options, exitCode) {
  if (options.cleanup) {
    console.log("Server close");
    for (let ww of wss.clients) {
      ww.send("shutdown");
      ww.close();
    }
    fs.rmSync("./jsTempFiles/", { recursive: true });
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

if (!fs.existsSync("./jsTempFiles/")) fs.mkdirSync("./jsTempFiles/");
console.log("server started");