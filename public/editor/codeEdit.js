let f = new URLSearchParams(window.location.search).get('id');


signInController.setOnSignIn(function () {
    /*if(!signInController.isSignedIn()){
        console.log("Not signed in");
        redirect("/401.shtml", "reason=notSignedIn");
    }*/
    //console.log("sdjkflsdj");
    let p = false;

    if (localStorage.getItem('id') != null)
        p = confirm("A previously unsaved version of a game has been found. Restore? (Clicking no will remove the backup!)");
    if (p) {
        if (localStorage.getItem('id') != '') {
            f = localStorage.getItem('id');
            updateFile(f);
            document.location.search = "?id=" + f;
        }
        else {
            f = null;
            document.querySelector("#gameTitle").value = localStorage.getItem('title');
            document.querySelector("#desc").value = localStorage.getItem('desc');
            document.getElementById("editor").value = localStorage.getItem('code');
        }
    }
    else

        if (f) {
            let doc = firebase.firestore().collection("GameMetadata").doc(f);
            let usr = firebase.firestore().collection("Users").doc(signInController.getUID());

            doc.get().then((doc) => {
                if (doc.exists) {
                    console.log(doc.get("Author").path);
                    if (doc.get("Author").path != usr.path)
                        redirect("/401.shtml", "reason=IncorrectUID");
                    //if(!doc.exists) redirect("/404.shtml";
                    document.querySelector("#gameTitle").value = doc.get("Title");
                    document.querySelector("#desc").value = doc.get("Description");
                    //TODO: add comments, dates, tags from doc
                    if (p) document.getElementById("editor").value = localStorage.getItem('code');
                    else fetchCode();
                } else redirect("/401.shtml", "reason=IncorrectGameID");
            })

        }
})

function reloadCode() {
    if (f) {
        let r = confirm("Retrieve code currently saved on server? This will delete all unsaved work!");
        if (r) fetchCode();
    }
    else {
        let r = confirm("Code hasn't been saved to server! Do you want to clear your current code? This will delete all unsaved work!");
        if (r) {
            document.getElementById("editor").value = "";
            window.localStorage.removeItem("code");
        }
    }
}

function localBackup() {
    window.localStorage.setItem("id", f ? f : "");
    if (f == null) {
        window.localStorage.setItem("title", document.getElementById("gameTitle").value);
        window.localStorage.setItem("desc", document.getElementById('desc').value);
        window.localStorage.setItem("category", "null");
        window.localStorage.setItem("tags", "null");
    }

    window.localStorage.setItem("code", document.getElementById('editor').value);
}

function updateMetadata() {
    if (f) {
        firebase.firestore().collection("GameMetadata").doc(f).set({
            "Category": "Default", //temp
            "Description": document.getElementById("desc").value,
            "Tags": [], //temp
            "Title": document.getElementById("gameTitle").value,
            "dateEdited": firebase.firestore.FieldValue.serverTimestamp()
        })
    } else localBackup();
}

window.onbeforeunload = function () {
    if (localStorage.getItem('id') != null) {
        let p = confirm("You have unsaved work! Remove unsaved changes? (Clicking no will backup changes locally)");
        if (!p) {
            clearBackup();
        }
        else {
            localBackup();
        }
    }
}

function textTrim() {
    let o = document.getElementById('editor').value;
    let r = encodeURI(o);
    return o;
}

function verifyCode() {
    if (document.getElementById("editor").value.length > 0)
        fetch('https://137.112.40.92:3000/verify-only', { method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers: { 'Content-Type': 'text/plain' }, body: textTrim() })
            .then(res => res.json()).then((res) => {
                if (res.body != "Result: SUCCESS") alert(res.body);
                else alert("Code passed.");
            })
    else alert("Error: no code.");
}

function saveCode() {
    if (document.getElementById("editor").value.length > 0)
        firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
            let cont = true;
            if (!f) {
                fetch('https://137.112.40.92:3000/verify-only', { method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers: { 'Content-Type': 'text/plain' }, body: textTrim() })
                    .then(res => res.json()).then((res) => {
                        if (res.body != "Result: SUCCESS") {
                            cont = false;
                            alert(res.body);
                        }
                        else {
                            //alert("Code passed.");
                            let usr = firebase.firestore().collection("Users").doc(signInController.getUID());
                            firebase.firestore().collection("GameMetadata").add({
                                "Author": usr,
                                "Category": "Default", //temp
                                "Description": document.getElementById("desc").value,
                                "Tags": [], //temp
                                "Title": document.getElementById("gameTitle").value,
                                "dateCreated": firebase.firestore.FieldValue.serverTimestamp(),
                                "dateEdited": firebase.firestore.FieldValue.serverTimestamp()
                            }).then(r => {
                                f = r.id;
                                updateFile(f);
                                //console.log(r);
                                fetch('https://137.112.40.92:3000/save/' + f, { method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers: { 'Content-Type': 'text/plain', 'x-auth': idToken }, body: textTrim() })
                                .then(res => res.json()).then((res) => {
                                    if (res.body != "Result: SUCCESS") {
                                        alert(res.body);
                                        return false;
                                    }
                                    else {
                                        alert("Code saved.");

                                        clearBackup();
                                        //window.localStorage.removeItem('code');
                                        return true;
                                    }
                                })
                                document.location.search="?id=" + f;
                            });
                            
                        }
                    })
            }
            else{
            fetch('https://137.112.40.92:3000/save/' + f, { method: 'POST', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers: { 'Content-Type': 'text/plain', 'x-auth': idToken }, body: textTrim() })
                .then(res => res.json()).then((res) => {
                    if (res.body != "Result: SUCCESS") {
                        alert(res.body);
                        return false;
                    }
                    else {
                        alert("Code saved.");

                        clearBackup();
                        //window.localStorage.removeItem('code');
                        return true;
                    }
                })
            }

        }).catch(function (error) {
            alert(error);
            return false;
            // Handle error
        });
    else {
        alert("Error: no code.");
        return false;
    }
}

function runCode() {
    if (saveCode())
        start();
}

function fetchCode() {
    firebase.auth().currentUser.getIdToken(/* forceRefresh */ true).then(function (idToken) {
        let r = new Request('https://137.112.40.92:3000/code/' + f, { method: 'GET', mode: 'cors', cache: 'no-cache', /*credentials: 'include', */ headers: { 'Content-Type': 'text/plain', 'x-auth': idToken } });
        fetch(r)
            .then(res => {
                console.log(res.status);
                return res.text();
            }).then(res => {
                document.getElementById("editor").value = res;
            })
    }).catch(function (error) {
        // Handle error
        console.log(error);
        redirect("/401.shtml", "reason=" + error);
    });
}