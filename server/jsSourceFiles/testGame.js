let x = 0, y = 0;
canvas("font = '30px Verdana'");
while (true) {
    x = Math.abs(Math.sin(time.time / 1000) * 100);
    y = Math.abs(Math.cos(time.time / 1000) * 100);

    time.wait(20);

    canvas("fillStyle = '#FFFFFF'");
    canvas("clearRect(0,0,1920,1080)");
    canvas("fillStyle = '#000000'");
    canvas(`fillText('${time.time}', ${x} , ${y})`);
    
}