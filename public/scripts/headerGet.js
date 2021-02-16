

//using a class here to utilize private fields in ES6 for security
//NOTE: actually not doing that, Firefox doesn't support them by default yet 
class signInController{
    static _user = null;
    static setUser(u){
        signInController._user = u;
    }

    static isSignedIn(){
        return !!signInController._user;
    }

    static getUID(){
        if(signInController.isSignedIn()) return signInController._user.uid;
        else return null;
    }

    static getEmail(){
        if(signInController.isSignedIn()) return signInController._user.email;
        else return null;
    }

    static getName(){
        if(signInController.isSignedIn()) return signInController._user.displayName;
        else return null;
    }

    static getPhoto(){
        if(signInController.isSignedIn()) return signInController._user.photoURL;
        else return null;
    }

    static getUser_TEMP(){
        return signInController._user;
    }

    static onSignIn(){};

    static setOnSignIn(func){
        signInController.onSignIn = func;
    }

    static onNoSignIn(){};

    static setOnNoSignIn(func){
        signInController.onNoSignIn = func;
    }
}

//PUT firebase login authentication code here (code that makes sure user is logged in, NOT code that logs in user)
//change the login/sign up buttons mostly

let headerInitialized = false;

function redirect(path, params){
    document.location.search=null;
    document.location.href = document.location.origin + "/" + path + "?" + params;
}

window.onload = function(){
    
    let firestore = firebase.firestore();

    firebase.auth().onAuthStateChanged((user) => {
        signInController.setUser(user);
        if(signInController.isSignedIn()){
            let userRef = firestore.collection('Users').doc(signInController.getUID());
            if(!userRef.exists){
                firestore.collection('Users').doc(signInController.getUID()).set({"Email": signInController.getEmail(), "Name": signInController.getName(), "Friends": [], "gamesList": [], "photoURL": signInController.getPhoto()});
            }
            updateHeader();
        }
    });
    
    fetch(window.location.origin + '/scripts/header.html', {method: 'GET', headers: {'Content-Type': 'text/html'}}).then(res => {
        return res.text()}).then(res => {
            document.getElementById('head').innerHTML = res;
            headerInitialized = true;
            updateHeader();
            
        });
}

function updateHeader(){
    if(headerInitialized){
        if(signInController.isSignedIn()){
            document.getElementById("logInOut").innerHTML = "Log Out";
            document.getElementById("profile").style.visibility = "visible";
            document.getElementById("myGames").style.visibility = "visible";
            //console.log(signInController.onSignIn);
            signInController.onSignIn();
        } else{
            document.getElementById("profile").style.visibility = "hidden";
            document.getElementById("myGames").style.visibility = "hidden";
            document.getElementById("logInOut").innerHTML = "Log In/Sign Up";
            signInController.onNoSignIn();
        }
    }
}

function logInOut(){
    if(signInController.isSignedIn())
        signOut();
    else window.location.pathname='/login/';
}

function signOut() {
    firebase.auth().signOut();
    window.location.pathname="/";
}
