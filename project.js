const projectsGrid = document.getElementById("projects-grid");
const projectsScroll = document.getElementById("projects-scroll");

// Scroll helper for arrow buttons
function scrollProjects(distance) {
  projectsScroll.scrollBy({ left: distance, behavior: 'smooth' });
}

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
              <a href="${data.githubURL}" target="_blank" class="btn-small">Details</a>
              <a href="${data.liveURL}" target="_blank" class="btn-small">Live Demo</a>
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
  } catch (err) {
    console.error("Error loading projects:", err);
    projectsGrid.innerHTML = "<p>Error loading projects.</p>";
  }
}

// Call this after Firebase initialized
loadProjects();