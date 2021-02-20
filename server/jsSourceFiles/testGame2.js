
cursor("none");
canvas("font = '30px Verdana'");
canvas("fillStyle = '#000000'");
canvas("fillRect(0,0,1920,1080)");
while (true) {
    
    canvas("fillStyle = '#FFFFFF'");
    canvas(`fillText('${inputs().mouseX}, ${inputs().mouseY}', ${1920/2} , ${1080/2})`);
    //if(inputs().keyPresses.length > 0){
    //    canvas(`fillText('${inputs().keyPresses[0]}', ${(1920/2)+50} , ${(1080/2)+50})`);
    //}
    time.wait(10);
    
    canvas("fillStyle = '#000000'");
    canvas("fillRect(0,0,1920,1080)");
    
    
}