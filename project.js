const projectsGrid = document.getElementById("projects-grid");
const projectsScroll = document.getElementById("projects-scroll");

// Scroll helper for arrow buttons
function scrollProjects(distance) {
  projectsScroll.scrollBy({ left: distance, behavior: 'smooth' });
}

// ----- CREATE ATTRACTIVE SCROLLABLE MODAL FOR LIVE DEMO -----
let modal = document.createElement("div");
modal.id = "screenshotModal";
modal.style.display = "none";
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.background = "rgba(0,0,0,0.7)";
modal.style.zIndex = "1000";
modal.style.justifyContent = "center";
modal.style.alignItems = "center";
modal.style.overflow = "auto"; // allow scrolling inside modal
modal.style.animation = "fadeInModal 0.4s ease";
modal.style.cursor = "pointer"; // click outside to close
modal.innerHTML = `
  <div id="modalContent" style="position: relative; max-width: 90%; max-height: 90%; cursor: auto; animation: zoomIn 0.4s ease; overflow: auto;">
    <span id="modalClose" style="position:absolute; top:10px; right:20px; font-size:30px; color:red; cursor:pointer;">&times;</span>
    <img id="modalImg" src="" style="width:100%; height:auto; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.4); display:block;">
  </div>
`;
document.body.appendChild(modal);

// Close modal by clicking ×
document.getElementById("modalClose").addEventListener("click", () => {
  modal.style.display = "none";
  document.body.style.overflow = ""; // enable main page scroll
});

// Close modal by clicking outside content
modal.addEventListener("click", (e) => {
  if (e.target.id === "screenshotModal") {
    modal.style.display = "none";
    document.body.style.overflow = ""; // enable main page scroll
  }
});

// Add CSS Animations
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInModal {
  from {opacity: 0;}
  to {opacity: 1;}
}
@keyframes zoomIn {
  from {transform: scale(0.8); opacity: 0;}
  to {transform: scale(1); opacity: 1;}
}

/* Make modal content scrollable */
#modalContent {
  overflow: auto;
}
`;
document.head.appendChild(style);

// ----- LOAD PROJECTS -----
async function loadProjects() {
  projectsGrid.innerHTML = '';
  projectsScroll.innerHTML = '';
  try {
    const snapshot = await db.collection("projects").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      projectsGrid.innerHTML = "<p>No projects found.</p>";
      return;
    }
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const techStack = Array.isArray(data.techStack) ? data.techStack.join(', ') : '';
      const div = document.createElement("div");
      div.classList.add("project-card");
      div.setAttribute("data-aos", "zoom-in");
      div.innerHTML = `
        <div class="project-img-wrapper">
          <img src="${data.imageURL}" alt="${data.title}" class="project-img">
          <div class="project-overlay">
            <div class="project-actions">
              <a href="${data.githubURL}" target="_blank" class="btn-small"><i class="fa-solid fa-code"></i> Details</a>
              <button class="btn-small live-demo-btn" data-screenshot="${data.imageURL}"><i class="fa-solid fa-play"></i> Live Demo</button>
            </div>
          </div>
        </div>
        <div class="project-name">${data.title}</div>
        <div class="project-meta">
          ${Array.isArray(data.tags) ? data.tags.map(tag => `<span>${tag}</span>`).join('') : ''}
        </div>
      `;

      // First 3 projects go to main grid
      if (index < 3) {
        projectsGrid.appendChild(div);
      } else {
        // Rest go to horizontal scroll section
        projectsScroll.appendChild(div);
      }
    });

    // Add click event for all Live Demo buttons
    const liveDemoButtons = document.querySelectorAll(".live-demo-btn");
    liveDemoButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        const screenshotURL = e.currentTarget.getAttribute("data-screenshot");
        const modalImg = document.getElementById("modalImg");
        modalImg.src = screenshotURL;
        modal.style.display = "flex"; // show modal

        // Disable main page scroll
        document.body.style.overflow = "hidden";
      });
    });

  } catch (err) {
    console.error("Error loading projects:", err);
    projectsGrid.innerHTML = "<p>Error loading projects.</p>";
  }
}

// Call this after Firebase initialized
loadProjects();
