const USERS_COLLECTION = 'Users';
var _ref = firebase.firestore().collection(USERS_COLLECTION);
let _documentSnapshot;
let ran = false;
let _unsubscribe = this._ref.orderBy("Email", "desc").limit(50	).onSnapshot((querySnapshot) => {
    console.log("User update!");
    querySnapshot.forEach((doc) => {
        let data = doc.data();
        let segment = doc.Ef.path.segments;
        let uid = segment[segment.length - 1];
        if (uid == signInController.getUID()) updateProfile(data);
    });
});

function updateProfile(data) {
    if (data.photoURL) document.querySelector("#profilePic").src = data.photoURL;
    document.querySelector("#usernameDisplay").innerHTML = data.Name;
}

// const ref = firebase.firestore().collection("Users");
// ref.onSnapshot((querySnapshot) =>{

//     querySnapshot.forEach((doc) => {
//         console.log(doc.data());
//     });
// });