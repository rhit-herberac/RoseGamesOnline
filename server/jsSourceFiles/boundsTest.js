canvas("moveTo(0,0)");
canvas("lineTo(1920,1080)");
canvas("stroke()");
canvas("lineTo(1920,0)");
canvas("stroke()");
canvas("lineTo(0,1080)");
canvas("stroke()");
canvas("font = '30px Verdana'");
canvas(`fillText('Hold space to cause an error.', ${1920/2}, 10)`);
while(true){if(inputs().keyPresses.indexOf(32) > -1) throw "Success! Error has been caught! Please restart the game."; time.wait(1000);}