signInController.setOnSignIn(function(){
    redirect("/profile/", "id=" + signInController.getUID());
});
signInController.setOnNoSignIn(function(){
    let ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', {
        signInSuccessUrl: "/profile/",
        signInOptions: [
            firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ]
    });
})

function signInRose() {
    Rosefire.signIn("ec7ba94e-47bd-4b2f-8dd9-c8bd69d901d3", (err, rfUser) => {
        if (err) {
            console.log("Rosefire error!", err);
            return;
        }
        console.log("Rosefire success!", rfUser);


        firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
            if (error.code === 'auth/invalid-custom-token') {
                console.log("The token you provided is not valid.");
            } else {
                console.log("signInWithCustomToken error", error.message);
            }
        }).then(()=>{signInController.onSignIn();});
    });
}