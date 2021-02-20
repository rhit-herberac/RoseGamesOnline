function main() {

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

    if (document.querySelector("#myGames")) {
        console.log("here");
        document.querySelector("#myGames").onclick = (event) => {
            console.log("todo");
            window.location.href = `../browse/?uid=${signInController.getUID()}`;
        }
    }
}

setTimeout(() => {
    main();
}, 500);
