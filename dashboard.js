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
  const snapshot = await db.collection("messages").orderBy("createdAt", "desc").get();
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
async function deleteMessage(id) {
  if (confirm("Are you sure you want to delete this message?")) {
    await db.collection("messages").doc(id).delete();
    loadMessages();
  }
}

// Reply to a message
function replyMessage(email) {
  window.open(`https://mail.google.com/mail/?view=cm&to=${email}`, "_blank");
}

// Search messages
document.getElementById("search-msg").addEventListener("input", async (e) => {
  const search = e.target.value.toLowerCase();
  const snapshot = await db.collection("messages").orderBy("createdAt", "desc").get();
  messagesContainer.innerHTML = '';
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name.toLowerCase().includes(search) || data.message.toLowerCase().includes(search)) {
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
async function loadCharts() {
  // Messages chart
  const msgSnapshot = await db.collection("messages").get();
  const msgDates = {};
  msgSnapshot.forEach(doc => {
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
  visSnapshot.forEach(doc => {
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
  if (!blogContainer) return;
  blogContainer.innerHTML = '';

  try {
    const snapshot = await db.collection("blogs").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      blogContainer.innerHTML = "<p>No blogs found.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();

      // Convert tags array to string
      const tags = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '';
      const author = data.author || 'Unknown';
      const createdDate = data.createdAt ? data.createdAt.toDate().toLocaleString() : 'Unknown';

      const div = document.createElement("div");
      div.classList.add("blog-item");
      div.innerHTML = `
        <p><strong>${data.title}</strong></p>
        <img src="${data.imageURL}" alt="${data.title}" style="max-width:100px; border-radius:8px; margin-top:5px;">
        <p>${data.content.substring(0, 100)}...</p>
        <p><strong>Author:</strong> ${author}</p>
        <p><strong>Date:</strong> ${createdDate}</p>
        <p><strong>Category:</strong> ${data.category || 'Uncategorized'}</p>
        <p><strong>Tags:</strong> ${tags}</p>
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

  } catch (err) {
    console.error("Error loading blogs:", err);
    blogContainer.innerHTML = "<p>Error loading blogs.</p>";
  }
}

// Add blog
async function addBlog(title, content, imageFile, category, tags, author) {
  if (!title || !content || !imageFile || !category || !author) {
    return alert("Fill all blog fields!");
  }

  // Convert tags string to array
  const tagsArray = tags
    ? tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
    : [];

  // Upload image to Cloudinary
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "portfolio_blog");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dppdoca6n/image/upload", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Image upload failed");

    const data = await res.json();
    const imageURL = data.secure_url;

    // Add blog to Firestore
    await db.collection("blogs").add({
      title,
      content,
      imageURL,
      category,
      tags: tagsArray,
      published: false,
      author, // added author
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Blog added successfully!");
    loadBlogs();

    // Clear input fields
    document.getElementById("blog-title").value = "";
    document.getElementById("blog-content").value = "";
    document.getElementById("blog-image").value = "";
    document.getElementById("blog-category").value = "";
    document.getElementById("blog-tags").value = "";
    document.getElementById("blog-author").value = ""; // clear author

  } catch (err) {
    console.error("Error adding blog:", err);
    alert("Failed to add blog. Please try again.");
  }
}

//edit
// --- Blog Modal Elements ---
const editBlogModal = document.getElementById("editBlogModal");
const closeBlogModalBtn = document.getElementById("closeBlogModal");
const editBlogForm = document.getElementById("editBlogForm");
let currentBlogId = null;

// --- Close Modal ---
closeBlogModalBtn.addEventListener("click", () => {
  editBlogModal.classList.remove("show");
});

window.addEventListener("click", (e) => {
  if (e.target === editBlogModal) {
    editBlogModal.classList.remove("show");
  }
});

// --- Open Blog Modal & Prefill ---
async function editBlog(id) {
  currentBlogId = id;
  const doc = await db.collection("blogs").doc(id).get();
  const data = doc.data();

  document.getElementById("edit-blog-title").value = data.title;
  document.getElementById("edit-blog-content").value = data.content;
  document.getElementById("edit-blog-author").value = data.author || '';
  document.getElementById("edit-blog-category").value = data.category || '';
  document.getElementById("edit-blog-tags").value = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '';

  editBlogModal.classList.add("show");
}

// --- Save Blog Edits ---
editBlogForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submit

  if (!currentBlogId) return;

  const updatedTitle = document.getElementById("edit-blog-title").value;
  const updatedContent = document.getElementById("edit-blog-content").value;
  const updatedAuthor = document.getElementById("edit-blog-author").value;
  const updatedCategory = document.getElementById("edit-blog-category").value;
  const updatedTags = document.getElementById("edit-blog-tags").value
    ? document.getElementById("edit-blog-tags").value.split(",").map(tag => tag.trim())
    : [];

  try {
    await db.collection("blogs").doc(currentBlogId).update({
      title: updatedTitle,
      content: updatedContent,
      author: updatedAuthor,
      category: updatedCategory,
      tags: updatedTags
    });

    // Close modal
    editBlogModal.classList.remove("show");

    // Reload blogs
    loadBlogs();

    // Show success message
    alert("Blog changes saved successfully!");

  } catch (err) {
    console.error("Error updating blog:", err);
    alert("Failed to save blog changes.");
  }
});


// Delete blog
async function deleteBlog(id) {
  if (confirm("Are you sure you want to delete this blog?")) {
    await db.collection("blogs").doc(id).delete();
    loadBlogs();
  }
}

// Publish/unpublish
async function togglePublish(id, currentState) {
  await db.collection("blogs").doc(id).update({ published: !currentState });
  loadBlogs();
}
// --- BLOG MANAGEMENT END ---




const projectContainer = document.getElementById("project-container");

// --- LOAD PROJECTS ---
async function loadProjects() {
  if (!projectContainer) return;

  // Clear container first to avoid duplicates
  projectContainer.innerHTML = '';

  try {
    const snapshot = await db.collection("projects").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      projectContainer.innerHTML = "<p>No projects found.</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);

      const div = document.createElement("div");
      div.classList.add("blog-item");
      div.innerHTML = `
        <p><strong>${data.title}</strong></p>
        <img src="${data.imageURL}" alt="${data.title}" style="max-width:100%; border-radius:8px; margin-top:5px;">
        <p>${data.description.substring(0, 100)}...</p>
        <p><strong>Category:</strong> ${data.category || 'Uncategorized'}</p>
        <p><strong>Tags:</strong> ${tags.join(', ')}</p>
        <div class="project-links">
          ${data.liveURL ? `<a href="${data.liveURL}" target="_blank" class="btn-small">Live Demo</a>` : ''}
          ${data.githubURL ? `<a href="${data.githubURL}" target="_blank" class="btn-small">Details</a>` : ''}
        </div>
        <div class="message-actions">
          <button class="reply" onclick="editProject('${doc.id}')">Edit</button>
          <button class="delete" onclick="deleteProject('${doc.id}')">Delete</button>
          <button class="publish" onclick="toggleProjectPublish('${doc.id}', ${data.published})">
            ${data.published ? "Unpublish" : "Publish"}
          </button>
        </div>
      `;
      projectContainer.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    projectContainer.innerHTML = "<p>Error loading projects.</p>";
  }
}

// --- ADD PROJECT ---
async function addProject(title, description, imageFile, liveURL, githubURL, category, tags) {
  if (!title || !description || !imageFile || !liveURL || !githubURL || !category || !tags) {
    return alert("Please fill all project fields, including Live URL and GitHub URL!");
  }

  const tagsArray = tags ? tags.split(",").map(t => t.trim()).filter(t => t) : [];
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("upload_preset", "portfolio_projects");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dppdoca6n/image/upload", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Image upload failed");

    const data = await res.json();
    const imageURL = data.secure_url;

    await db.collection("projects").add({
      title,
      description,
      imageURL,
      liveURL,
      githubURL,
      category,
      tags: tagsArray,
      published: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Project added successfully!");
    loadProjects();

    // Clear input fields
    document.getElementById("project-title").value = "";
    document.getElementById("project-desc").value = "";
    document.getElementById("project-image").value = "";
    document.getElementById("project-live").value = "";
    document.getElementById("project-github").value = "";
    document.getElementById("project-category").value = "";
    document.getElementById("project-tags").value = "";

  } catch (err) {
    console.error(err);
    alert("Failed to add project. Error: " + err.message);
  }
}

// --- PROJECT EDIT MODAL ---
// --- Project Modal Elements ---
const editProjectModal = document.getElementById("editModal");
const closeProjectModalBtn = document.getElementById("closeProjectModal");
const editProjectForm = document.getElementById("edit-form");
let currentProjectId = null;

// --- Close Modal ---
closeProjectModalBtn.addEventListener("click", () => {
  editProjectModal.classList.remove("show");
});

window.addEventListener("click", (e) => {
  if (e.target === editProjectModal) {
    editProjectModal.classList.remove("show");
  }
});

// --- Open Project Modal & Prefill ---
function editProject(id) {
  currentProjectId = id;

  db.collection("projects").doc(id).get().then(doc => {
    const data = doc.data();

    document.getElementById("edit-title").value = data.title || '';
    document.getElementById("edit-desc").value = data.description || '';
    document.getElementById("edit-live").value = data.liveURL || '';
    document.getElementById("edit-github").value = data.githubURL || '';
    document.getElementById("edit-category").value = data.category || '';
    document.getElementById("edit-tags").value = Array.isArray(data.tags) ? data.tags.join(", ") : '';

    editProjectModal.classList.add("show");
  }).catch(err => {
    console.error("Error fetching project:", err);
    alert("Failed to load project data.");
  });
}

// --- Save Project Edits ---
editProjectForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submit

  if (!currentProjectId) return;

  const updatedTitle = document.getElementById("edit-title").value;
  const updatedDesc = document.getElementById("edit-desc").value;
  const updatedLive = document.getElementById("edit-live").value;
  const updatedGithub = document.getElementById("edit-github").value;
  const updatedCategory = document.getElementById("edit-category").value;
  const updatedTags = document.getElementById("edit-tags").value
    ? document.getElementById("edit-tags").value.split(",").map(tag => tag.trim())
    : [];

  try {
    await db.collection("projects").doc(currentProjectId).update({
      title: updatedTitle,
      description: updatedDesc,
      liveURL: updatedLive,
      githubURL: updatedGithub,
      category: updatedCategory,
      tags: updatedTags
    });

    // Close modal
    editProjectModal.classList.remove("show");

    // Reload projects
    loadProjects();

    // Show success message
    alert("Project changes saved successfully!");

  } catch (err) {
    console.error("Error updating project:", err);
    alert("Failed to save project changes.");
  }
});



// --- DELETE PROJECT ---
async function deleteProject(id) {
  if (confirm("Are you sure you want to delete this project?")) {
    await db.collection("projects").doc(id).delete();
    loadProjects();
  }
}

// --- PUBLISH / UNPUBLISH PROJECT ---
async function toggleProjectPublish(id, currentState) {
  await db.collection("projects").doc(id).update({ published: !currentState });
  loadProjects();
}

// Call after Firebase initialized
auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "admin.html";
  else {
    trackActiveUser(user.uid);
    loadMessages();
    loadCharts();
    loadActiveUsers();
    trackVisitor();
    loadBlogs();
    loadProjects();
  }
});