const sock = new WebSocket("wss://137.112.40.92:8081");
const canvas = document.getElementById("canvas").getContext("2d");
let id = null;
let file = new URLSearchParams(window.location.search).get('id');
let mouseState = "default";
let focus = false;
let playing = false;
let c = document.getElementById("canvas");
const status = document.getElementById("status");
sock.onopen = function (e) {
  console.log("[open] Connection established");
  sock.isAlive = true;
};

function sendMessage(msg) {
  if (sock.isAlive) {
    sock.send(id + " " + msg);
  } else console.log("Attempting to send message thru dead socket! Message: " + msg);
}

function updateAllValues() {
  sendMessage("mousepos " + inputs.mouseX + " " + inputs.mouseY);
  sendMessage("mousebtns " + inputs.mousePresses.join(" "));
  sendMessage("scrollwheel " + inputs.scrollX + " " + inputs.scrollY + " " + inputs.scrollZ + " " + inputs.scrollMode);
  sendMessage("keys " + inputs.keyPresses.join(" "));
}

class inputs {
  static mousePresses = [];
  static keyPresses = [];
  static scrollX = 0;
  static scrollY = 0;
  static scrollZ = 0;
  static scrollMode = 0;
  static mouseX = 0;
  static mouseY = 0;

  static setMousePos(event) {
    if (focus) {
      let rect = c.getBoundingClientRect();
      //console.log("Pos: " + ((event.clientX - rect.left)/(rect.right-(rect.left)))*1920 + " " + ((event.clientY - rect.top)/(rect.bottom-(rect.top)))*1080);
      inputs.mouseX = ((event.clientX - rect.left) / (rect.right - (rect.left))) * 1920;
      inputs.mouseY = ((event.clientY - rect.top) / (rect.bottom - (rect.top))) * 1080;
      sendMessage("mousepos " + inputs.mouseX + " " + inputs.mouseY);
    }
  }
}

//function that makes a string out of the elements of an array arr starting at index start
function arrToStr(arr, start) {
  let r = "";
  let a = start;
  for (; a < arr.length - 1; a++)
    r += arr[a] + " ";
  r += arr[a];
  return r;
}

let debug = false;

sock.onmessage = function (event) {
  if (debug) console.log(d);
  //console.log(`[message] Data received from server: ${event.data}`);
  //format: [op] [messageData]
  let d = String(event.data).split(" ");
  switch (d[0]) {

    case "ID":
      id = d[1];
      status.innerHTML = "ID retrieved";
      break;
    case "load":
      status.innerHTML = "Loading...";

      break;
    case "ready":
      updateAllValues();
      status.innerHTML = "Ready";
      document.getElementById("word").innerHTML = "re-focus";
      playing = true;
      gainFocus();
      break;
    case "error":
      loseFocus();
      status.innerHTML = "Server error";
      alert("Server error, please reload page.");
      playing = false;
      break;
    case "stop":
      status.innerHTML = "Stopped.";
      document.getElementById("word").innerHTML = "start";
      canvas.clearRect(0, 0, 1920, 1080);
      playing = false;
      loseFocus();
      break;
    case "shutdown":
      status.innerHTML = "Server shutdown.";
      alert("Server shutdown.");
      canvas.clearRect(0, 0, 1920, 1080);
      loseFocus();
      playing = false;
      sock.isAlive = false;
      break;
    case "cursor":
      updateMouse(d[1]);
      break;
    case "alert": case "canvas":
      //console.log(arrToStr(d, 1));
      try {
        eval(arrToStr(d, 1));
      }
      catch (e) {
        stop();
        alert(e);
        console.log(e);
      }
      break;
    case "debug":
      console.log("DEBUG: " + arrToStr(d, 1));
      break;
    default:
      console.log("BAD server message: " + d);
  }
};

function updateMouse(val = null) {
  if (val) mouseState = val;
  if (focus) c.style.cursor = mouseState;
  else c.style.cursor = "default";

}

function gainFocus() {
  if (!focus) {
    //console.log("gain focus");
    focus = true;
    c.focus();
    c.style.filter = "blur(0)";
    document.body.style.position = "fixed";
    document.getElementById("disableStatus").style.visibility = "hidden";
    updateMouse();
    if (!playing)
      start();
    else sendMessage("focus true");
  }
}

function loseFocus() {
  if (focus) {
    //console.log("lose focus");
    document.body.focus();
    c.style.filter = "blur(10px)";
    focus = false;
    document.body.style.position = "static";
    document.getElementById("disableStatus").style.visibility = "visible";
    updateMouse();
    if (playing) sendMessage("focus false");
  }
}


document.onmousedown = function (event) {
  if (focus) event.preventDefault();
}

document.onmouseup = function (event) {
  if (focus) event.preventDefault();
}

document.oncontextmenu = function (event) { if (focus) { event.preventDefault(); return false; } };

c.ontouchstart = function (event) {
  loseFocus();
  alert("Games do not have support for touchscreen; please use mouse and keyboard.");
}

c.onmouseleave = loseFocus;
//c.onmouseenter = gainFocus();

c.onmousedown = function (event) {
  //console.log("mousedown: " + event.button);
  if (!focus)
    gainFocus();
  event.preventDefault();
  if (inputs.mousePresses.indexOf(event.button) < 0) {
    inputs.mousePresses.push(event.button);
    sendMessage("mousebtns " + inputs.mousePresses.join(" "));
  }
}

c.onmousemove = inputs.setMousePos;

c.onmouseup = function (event) {
  
  if (focus) {
    event.preventDefault();
    if (inputs.mousePresses.indexOf(event.button) > -1) {
      inputs.mousePresses.splice(inputs.mousePresses.indexOf(event.button), 1);
      //console.log("mouseup: " + inputs.mousePresses);
      sendMessage("mousebtns " + inputs.mousePresses.join(" "));
    }

  }
}

c.onwheel = function (event) {
  //console.log("scrollwheel");
  if (focus) {
    event.preventDefault();
    inputs.scrollX = event.deltaX;
    inputs.scrollY = event.deltaY;
    inputs.scrollZ = event.deltaZ;
    inputs.scrollMode = event.deltaMode;
    sendMessage("scrollwheel " + inputs.scrollX + " " + inputs.scrollY + " " + inputs.scrollZ + " " + inputs.scrollMode);
    sendMessage("scrollwheel 0 0 0 0");
  }
}

document.onkeydown = function (event) {
  //console.log("keydown: " + event.keyCode);
  if (focus) {
    event.preventDefault();
    if (event.keyCode === 27)
      loseFocus();
    else if (inputs.keyPresses.indexOf(event.keyCode) < 0) {
      inputs.keyPresses.push(event.keyCode);
      sendMessage("keys " + inputs.keyPresses.join(" "));
    }

  }
}

document.onkeyup = function (event) {
  //console.log("keyup: " + event.keyCode);
  if (focus) {
    event.preventDefault();
    if (inputs.keyPresses.indexOf(event.keyCode) > -1) {
      inputs.keyPresses.splice(inputs.keyPresses.indexOf(event.keyCode), 1);
      sendMessage("keys " + inputs.keyPresses.join(" "));
    }

  }
}

function start() {
  if (file)
    sendMessage("start " + file);
  else status.innerHTML = "bad URL";
  document.location.pathname="/404.shtml";
}

function stop() {
  sendMessage("stop");
}

//LISTENER STRUCTURE:
//All listeners (key, mouse, touch) will be bound to functions locally, and defined as variables
//THEN in onmessage if the request is to get a sensor value like getmousepos, then the respective value will be sent to the server


sock.onclose = function (event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    status.innerHTML = "Server closed";
    sock.isAlive = false;
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    console.log('[close] Connection died');
    sock.isAlive = false;
  }
};

sock.onerror = function (error) {
  console.log(`[error] ${error.message}`);
  status.innerHTML = "Network error";
};