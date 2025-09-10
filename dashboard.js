// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLFaerxTry-1UVRqDY1U_5jy3YRok7rr8",
  authDomain: "my-portfolio-b663c.firebaseapp.com",
  projectId: "my-portfolio-b663c",
  storageBucket: "my-portfolio-b663c.firebasestorage.app",
  messagingSenderId: "557740350603",
  appId: "1:557740350603:web:6ddbd7d59533f3242dc88e",
  measurementId: "G-FDE9ZR490J"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Track active user in Firestore
function trackActiveUser(userId) {
  db.collection("activeUsers").doc(userId).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function loadActiveUsers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // last 5 minutes
  const snapshot = await db.collection("activeUsers")
    .where("lastActive", ">=", fiveMinutesAgo)
    .get();

  document.getElementById("active-users").textContent = snapshot.size;
}

// --- NEW: Track visitor ---
function trackVisitor() {
  const visitorId = localStorage.getItem("visitorId") || generateVisitorId();
  localStorage.setItem("visitorId", visitorId);

  const visitorRef = db.collection("visitors").doc(visitorId);
  visitorRef.set({
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function generateVisitorId() {
  return 'visitor_' + Math.random().toString(36).substr(2, 9);
}

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut().then(() => window.location.href = "admin.html");
});

// Load messages and stats
const messagesContainer = document.getElementById("messages-container");
const totalMessages = document.getElementById("total-messages");
const totalVisitors = document.getElementById("total-visitors");
const activeUsers = document.getElementById("active-users");

// Load messages
async function loadMessages() {
  messagesContainer.innerHTML = '';
  const snapshot = await db.collection("messages").orderBy("createdAt","desc").get();
  totalMessages.textContent = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("message-item");
    div.innerHTML = `
      <p><strong>${data.name}</strong>: ${data.message}</p>
      <div class="message-actions">
        <button class="reply" onclick="replyMessage('${data.email}')">Reply</button>
        <button class="delete" onclick="deleteMessage('${doc.id}')">Delete</button>
      </div>
    `;
    messagesContainer.appendChild(div);
  });
}

// Delete a message
async function deleteMessage(id){
  if(confirm("Are you sure you want to delete this message?")){
    await db.collection("messages").doc(id).delete();
    loadMessages();
  }
}

// Reply to a message (opens Gmail in new tab)
function replyMessage(email){
  window.open(`https://mail.google.com/mail/?view=cm&to=${email}`, "_blank");
}

// Search messages
document.getElementById("search-msg").addEventListener("input", async (e)=>{
  const search = e.target.value.toLowerCase();
  const snapshot = await db.collection("messages").orderBy("createdAt","desc").get();
  messagesContainer.innerHTML = '';
  snapshot.forEach(doc=>{
    const data = doc.data();
    if(data.name.toLowerCase().includes(search) || data.message.toLowerCase().includes(search)){
      const div = document.createElement("div");
      div.classList.add("message-item");
      div.innerHTML = `
        <p><strong>${data.name}</strong>: ${data.message}</p>
        <div class="message-actions">
          <button class="reply" onclick="replyMessage('${data.email}')">Reply</button>
          <button class="delete" onclick="deleteMessage('${doc.id}')">Delete</button>
        </div>
      `;
      messagesContainer.appendChild(div);
    }
  });
});

// Chart - Messages over time
async function loadCharts(){
  // Messages chart
  const msgSnapshot = await db.collection("messages").get();
  const msgDates = {};
  msgSnapshot.forEach(doc=>{
    const date = doc.data().createdAt?.toDate().toLocaleDateString() || 'Unknown';
    msgDates[date] = (msgDates[date] || 0) + 1;
  });

  const msgCtx = document.getElementById("messagesChart").getContext("2d");
  new Chart(msgCtx, {
    type: 'line',
    data: {
      labels: Object.keys(msgDates),
      datasets: [{
        label: 'Messages',
        data: Object.values(msgDates),
        borderColor: '#0077b6',
        backgroundColor: 'rgba(0,119,182,0.2)',
        fill: true
      }]
    }
  });

  // Visitors chart
  const visSnapshot = await db.collection("visitors").get();
  const visDates = {};
  visSnapshot.forEach(doc=>{
    const date = doc.data().timestamp?.toDate().toLocaleDateString() || 'Unknown';
    visDates[date] = (visDates[date] || 0) + 1;
  });

  const visCtx = document.getElementById("visitorsChart").getContext("2d");
  new Chart(visCtx, {
    type: 'line',
    data: {
      labels: Object.keys(visDates),
      datasets: [{
        label: 'Visitors',
        data: Object.values(visDates),
        borderColor: '#ff4d6d',
        backgroundColor: 'rgba(255,77,109,0.2)',
        fill: true
      }]
    }
  });

  // Total visitors
  totalVisitors.textContent = visSnapshot.size;
}

// Initialize dashboard
auth.onAuthStateChanged(user => {
  if(!user) window.location.href = "admin.html";
  else {
    trackActiveUser(user.uid);
    loadMessages();
    loadCharts();
    loadActiveUsers();

    // --- Track visitors here ---
    trackVisitor();
  }
});
