// Firebase config (same as your website)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBLFaerxTry-1UVRqDY1U_5jy3YRok7rr8",
  authDomain: "my-portfolio-b663c.firebaseapp.com",
  projectId: "my-portfolio-b663c",
  storageBucket: "my-portfolio-b663c.firebasestorage.app",
  messagingSenderId: "557740350603",
  appId: "1:557740350603:web:6ddbd7d59533f3242dc88e",
  measurementId: "G-FDE9ZR490J"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Admin login button
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "dashboard.html"; // Redirect to admin dashboard
  } catch (error) {
    document.getElementById("login-msg").innerText = error.message;
  }
});
