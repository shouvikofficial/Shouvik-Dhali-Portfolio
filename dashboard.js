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

// Track active user
function trackActiveUser(userId) {
  db.collection("activeUsers").doc(userId).set({
    lastActive: firebase.firestore.FieldValue.serverTimestamp()
  });
}

// Load active users
async function loadActiveUsers() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const snapshot = await db.collection("activeUsers")
    .where("lastActive", ">=", fiveMinutesAgo)
    .get();
  document.getElementById("active-users").textContent = snapshot.size;
}

// Track visitor
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

// Messages
const messagesContainer = document.getElementById("messages-container");
const totalMessages = document.getElementById("total-messages");
const totalVisitors = document.getElementById("total-visitors");

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

// Reply to a message
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

// Charts
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

  totalVisitors.textContent = visSnapshot.size;
}

// --- BLOG MANAGEMENT START ---
const blogContainer = document.getElementById("blog-container");

// Load blogs
async function loadBlogs() {
  if(!blogContainer) return;
  blogContainer.innerHTML = '';
  const snapshot = await db.collection("blogs").orderBy("createdAt", "desc").get();
  if(snapshot.empty) blogContainer.innerHTML = "<p>No blogs found.</p>";
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.classList.add("message-item");
    div.innerHTML = `
      <p><strong>${data.title}</strong></p>
      <img src="${data.imageURL}" alt="${data.title}" style="max-width:100px; border-radius:8px; margin-top:5px;">
      <p>${data.content.substring(0,100)}...</p>
      <div class="message-actions">
        <button class="reply" onclick="editBlog('${doc.id}')">Edit</button>
        <button class="delete" onclick="deleteBlog('${doc.id}')">Delete</button>
        <button class="publish" onclick="togglePublish('${doc.id}', ${data.published})">
          ${data.published ? "Unpublish" : "Publish"}
        </button>
      </div>
    `;
    blogContainer.appendChild(div);
  });
}

// Add blog
async function addBlog(title, content, imageFile) {
  if(!title || !content || !imageFile) return alert("Fill all blog fields!");

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "portfolio_blog"); // replace with your preset

  const res = await fetch("https://api.cloudinary.com/v1_1/dppdoca6n/image/upload", { // replace with your cloud name
    method: "POST",
    body: formData
  });

  const data = await res.json();
  const imageURL = data.secure_url;

  await db.collection("blogs").add({
    title,
    content,
    imageURL,
    published: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  loadBlogs();
}

// Edit blog
async function editBlog(id) {
  const doc = await db.collection("blogs").doc(id).get();
  const data = doc.data();
  const newTitle = prompt("Edit Title", data.title);
  const newContent = prompt("Edit Content", data.content);
  if(!newTitle || !newContent) return;
  await db.collection("blogs").doc(id).update({ title: newTitle, content: newContent });
  loadBlogs();
}

// Delete blog
async function deleteBlog(id){
  if(confirm("Are you sure you want to delete this blog?")){
    await db.collection("blogs").doc(id).delete();
    loadBlogs();
  }
}

// Publish/unpublish
async function togglePublish(id, currentState){
  await db.collection("blogs").doc(id).update({ published: !currentState });
  loadBlogs();
}
// --- BLOG MANAGEMENT END ---

// Initialize dashboard
auth.onAuthStateChanged(user => {
  if(!user) window.location.href = "admin.html";
  else {
    trackActiveUser(user.uid);
    loadMessages();
    loadCharts();
    loadActiveUsers();
    trackVisitor();
    loadBlogs();
  }
});
