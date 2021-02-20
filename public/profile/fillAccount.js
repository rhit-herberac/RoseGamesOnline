const USERS_COLLECTION = 'Users';
const GAME_COLLECTION = 'GameMetadata';

if (document.querySelector("#mainPage")) {
    browse_param();
}


var _ref = firebase.firestore().collection(USERS_COLLECTION);
let _documentSnapshot;
let ran = false;
let _unsubscribe = _ref.orderBy("Email", "desc").limit(50).onSnapshot((querySnapshot) => {
    console.log("User update!");
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        let segment = doc.Ef.path.segments;
        let uid = segment[segment.length - 1];
        if (uid == signInController.getUID() && document.querySelector("#profileContainer")) updateProfile(data);
    });
});

function updateProfile(data) {
    if (data.photoURL) document.querySelector("#profilePic").src = data.photoURL;
    document.querySelector("#usernameDisplay").innerHTML = data.Name;
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
