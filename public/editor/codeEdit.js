let f = new URLSearchParams(window.location.search).get('id');


signInController.setOnSignIn(function(){
    /*if(!signInController.isSignedIn()){
        console.log("Not signed in");
        redirect("/401.shtml", "reason=notSignedIn");
    }*/
    //console.log("sdjkflsdj");
    

    if(f){
        let doc = firebase.firestore().collection("GameMetadata").doc(f);
        let usr = firebase.firestore().collection("Users").doc(signInController.getUID());
        if(doc)
            doc.get().then((doc)=>{
                console.log(doc.get("Author").path);
                if(doc.get("Author").path != usr.path )
                    redirect("/401.shtml", "reason=IncorrectUID");
                //if(!doc.exists) redirect("/404.shtml";
                document.querySelector("#gameTitle").value = doc.get("Title");
                document.querySelector("#desc").innerHTML = doc.get("Description");
                //TODO: add comments, dates, tags from doc
                fetchCode();
            })
        else redirect("/401.shtml", "reason=IncorrectGameID");
    }
})


function textTrim(){
    let o = document.getElementById('editor').value;
    let r = encodeURI(o);
    return o;
}

function verifyCode(){
    fetch('https://137.112.40.92:3000/verify-only', {method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers:{'Content-Type': 'text/plain'}, body: textTrim()})
    .then(res => res.json()).then((res) => {
        if(res.body != "Result: SUCCESS") alert(res.body);
        else alert("Code passed.");
    })
}

function saveCode(){
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
        fetch('https://137.112.40.92:3000/save/' + f, {method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers:{'Content-Type': 'text/plain', 'x-auth': idToken}, body: textTrim()})
        .then(res => res.json()).then((res) => {
        if(res.body != "Result: SUCCESS"){
            alert(res.body);
            return false;
        }
        else{
            alert("Code saved.");
            return true;
        }
    })
      }).catch(function(error) {
          alert(error);
        // Handle error
      });
}

function runCode(){
    if(saveCode())
    start();
}

function fetchCode(){
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
        let r = new Request('https://137.112.40.92:3000/code/' + f, {method: 'GET', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers:{'Content-Type': 'text/plain', 'x-auth': idToken}});
        fetch(r)
    .then(res => {
        console.log(res.status);
        return res.text();
    }).then(res => {
        document.getElementById("editor").innerHTML = res;
    })
      }).catch(function(error) {
        // Handle error
        console.log(error);
        redirect("/401.shtml", "reason=" + error);
      });
}