


//class setup will be autogenerated upon successful verification
//Base file for jsTempFiles to run games

exports.run = (canvas, alert, cursor, inputs, end, debug) => {
    let True = true; //lazy
    try {

        //controller to determine time since program execution, as well as delay/wait/sleep (within thread)
        class time {
            static get time() {
                return Date.now()-time._time;
            }

            static get start(){
                return time._time;
            }

            static construct() {
                time._time = Date.now();

                time.wait = function (ms) {
                    let o = Date.now();
                    while (Date.now() < (o + ms)) {let temp = 62*112; /*this is so that the thread doesn't overload and crash the server, because that has happened. It's just a random statement that's guaranteed to take up a few cpu cycles.*/}
                }
            }
            //verification will throw error if any attempt to access _time is found
        };

        time.construct();
        canvas("clearRect(0,0,1920,1080)");
        //increase time every ms, so time = num of ms since execution

        //BEGIN USER CODE- DO NOT MODIFY BELOW HERE
        //CODEREPLACE
        //END USER CODE- DO NOT MODIFY ABOVE HERE
        end();
    } catch (e) {
        alert(e);
        end();
    }
}