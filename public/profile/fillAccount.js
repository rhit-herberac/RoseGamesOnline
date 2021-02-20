const USERS_COLLECTION = 'Users';
const GAME_COLLECTION = 'GameMetadata';
if (document.querySelector("#browsePage")) {
    browse_param();
}

if (document.querySelector("#profileContainer")) {
    profile_param();
}

if (document.querySelector("#mainPage")) {
    main_game();
    main_prof();
}

function profile_param() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let uid = urlParams.get('id');
    if (!uid) uid = signInController.getUID();
    console.log(uid);
    if(uid == null) redirect("/404.shtml", "");
    var _ref = firebase.firestore().collection(USERS_COLLECTION);

    let _unsubscribe = _ref.onSnapshot((querySnapshot) => {
        console.log("User update!");
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            console.log(data);
            let segment = doc.Ef.path.segments;
            let id = segment[segment.length - 1];
            console.log(id);
            if (id == uid) updateProfile(data);
        });
    });
}



function updateProfile(data) {
    console.log("here");
    if (data.photoURL) document.querySelector("#profilePic").src = data.photoURL;
    document.querySelector("#usernameDisplay").innerHTML = data.Name;
}

function main_prof() {
    var _ref = firebase.firestore().collection(USERS_COLLECTION).limit(10);
    let _unsubscribe = _ref.onSnapshot((querySnapshot) => {
        document.querySelector("#mainProfiles").innerHTML = '';
        console.log("User update!");
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            let segment = doc.Ef.path.segments;
            let id = segment[segment.length - 1];
            createCap(data, id);
        });
    });
}

function createCap(data, id) {
    let img = "../images/missing.png";
    if (data.photoURL) img = data.photoURL;
    document.querySelector("#mainProfiles").innerHTML += `<div><img src=${img}><p><a href="../profile/?id=${id}">${data.Name}</a></p></div>`
}

function main_game() {
    document.querySelector("#gameList").innerHTML = '';
    var _ref = firebase.firestore().collection(GAME_COLLECTION).limit(15);
    let _unsubscribe = _ref.onSnapshot((querySnapshot) => {
        console.log("Game update!");
        document.querySelector("#gameList").innerHTML = '';
        querySnapshot.forEach((doc) => {
            let cur = doc;
            let data = doc.data();
            addGame(data, cur);
        });
    });
}

function browse_param() {
    document.querySelector("#gameList").innerHTML = '';
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const uid = urlParams.get('uid');
    var _ref = firebase.firestore().collection(GAME_COLLECTION);
    let _unsubscribe = _ref.onSnapshot((querySnapshot) => {
        console.log("Game update!");
        querySnapshot.forEach((doc) => {
            if (uid) {
                let cur = doc;
                let data = doc.data();
                let auth = data.Author;
                if (auth) {
                    let seg = auth.Ef.path.segments;
                    let id = seg[seg.length - 1];
                    if (id == uid) addGame(data, cur);
                }
            } else {
                let cur = doc;
                let data = doc.data();
                addGame(data, cur);
            }

        });
    });
}

function addGame(data, cur) {
    let author = data.Author;
    author.get().then((a) => {

        let name = a.get("Name");
        console.log(data);
        let seg = cur.Ef.path.segments;
        let id = seg[seg.length - 1];
        document.querySelector("#gameList").innerHTML += `<div id="card"><a href="../game/?id=${id}"><h3>${data.Title}</h3><a id="aLink" href="../profile/?id=${a.id}">
    <pre id="author">${name}</pre></a></a><p>${data.Description}</div>`
    })

}

function updateBtns() {
    if (document.querySelector("#friendsButton")) {
        document.querySelector("#friendsButton").onclick = (event) => {
            window.location.href = "friends.html";
        }
    }

    if (document.querySelector("#addFriendButton")) {
        document.querySelector("#addFriendButton").onclick = (event) => {
            console.log("todo");
        }
    }
}
