# RoseGamesOnline

Rose Games Online is a website which uses a NodeJs WebSocket server to allow users to program and play games in Javascript, with HTML Canvas graphics. Read the readme to find out how to run the website yourself, as the url https://rosegamesonline.web.app will cease to run any games soon.

I am aware that these instructions are long and confusing, and it is possible to simplify the process, but that has not been done yet.

In a nutshell, we will be setting up a Firebase website, an HTTPS server, and a WebSocket server. The Firebase site will act as a frontend host, and with Cloud Firestore, host metadata for games and users; the HTTPS server will interact with the Firebase server so users can upload and edit code. The WebSocket server will read code saved by the HTTPS server and send messages thru a WebSocket to a user who is playing a game.

1. Set up a Firebase project, and enable Cloud Firestore and Hosting, from here: https://console.firebase.google.com . Be sure to set it up with your favorite website editing IDE, and make sure you have NodeJS installed.
1.5. make sure worker, worker_thread, ws, express, cors, fs, firebase-admin and https are installed to Node via npm (npm install packagename).
2. Create a folder /server/ssl. In this folder, you need to generate an SSL key. Otherwise, hosting on FIrebase wouldn't work. Save the private key as private.pem, and the certificate as cert.pem, and the certificate authority bundle as ca_bundle.crt. All these files are in the /server/ssl directory.
2.5. Go onto Firebase and retrieve credentials for a service account. Go to project settings -> Service accounts -> and click Generate New Private Key. Move the file into /server/ssl.
3. Open /server/uploadAndVerification.js. Modify the line "const serviceAccount = require..." to point to the recently downloaded service account json file. Below that, modify the line "const whitelist = ..." so that the array contains all the websites which would have access to Firebase and the NodeJS server (this would include your Firebase URL, https and http, as well as the NodeJS server's IP address.). Modify any other variables below if necessary.
3.5. Scroll down to the bottom of /server/uploadAndVerification.js and upload "const port" and "const host" to match your server's IP address and port. Note, this file is for an HTTPS server which manages files.
4. Open /server/webSocket.js. Modify the ssl imports at the top if necessary. To change the WebSocket server port, modify the number 8081 in the line "httpsServer.listen(8081);" to your liking.
5. Open /public/scripts/gameServe.js, and modify the string in the first line, "wss://137.112.40.92:8081", to point to your NodeJS WebSocket server (the port matching the one set in step 4, and the IP of the server itself).
6. Open /public/editor/codeEdit.js, and modify the string in the second line, "https://137.112.40.92:3000/", to point to the HTTPS server set up in step 3.5.
7. Set up your Firebase project into the root directory of the project (location of public/ and server/ folders). Then, use "firebase deploy" in console and follow the instructions to push the website publicly.
8. In a console window on the server, cd into the server/ directory and "node ./webSocket.js". This will start the webSocket server, which runs the game code and interaction.
9. In another console window on the server, cd again into /server and "node ./uploadAndVerification.js". This will start an HTTPS server which will handle uploading and retrieving code which the WebSocket server will then run.
