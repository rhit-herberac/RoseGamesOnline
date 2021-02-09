window.onload = function(){
    let h = fetch(window.location.origin + '/scripts/header.html', {method: 'GET', headers: {'Content-Type': 'text/html'}}).then(res => {return res.text()}).then(res => document.getElementById('head').innerHTML = res);
}

//PUT firebase login authentication code here (code that makes sure user is logged in, NOT code that logs in user)
//change the login/sign up buttons mostly