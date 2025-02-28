// Auth functions
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Logged in:", user.email);
            // Handle successful login
        })
        .catch((error) => {
            console.error("Login error:", error.message);
            // Handle errors
        });
}

function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Signed up:", user.email);
            // Handle successful signup
        })
        .catch((error) => {
            console.error("Signup error:", error.message);
            // Handle errors
        });
}

// Auth state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log("User is signed in:", user.email);
    } else {
        // User is signed out
        console.log("User is signed out");
    }
});
