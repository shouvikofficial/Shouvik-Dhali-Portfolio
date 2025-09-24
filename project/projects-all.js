const projectsGrid = document.getElementById("projects-grid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const tagFilter = document.getElementById("tagFilter");

// ----- CREATE DYNAMIC MODAL LIKE HOME PAGE -----
let modal = document.createElement("div");
modal.id = "screenshotModal";
modal.style.display = "none";
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.background = "rgba(0,0,0,0.8)";
modal.style.zIndex = "1000";
modal.style.justifyContent = "center";
modal.style.alignItems = "flex-start"; // allow scroll for long images
modal.style.overflowY = "auto";
modal.style.padding = "20px";
modal.style.boxSizing = "border-box";
modal.style.cursor = "pointer";

modal.innerHTML = `
  <div id="modalContent" style="
    position: relative; 
    max-width: 90%; 
    margin: 40px auto; 
    cursor: auto; 
    overflow: auto;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
  ">
    <span id="modalClose" style="
      position:absolute; 
      top:10px; 
      right:20px; 
      font-size:2rem; 
      color:red; 
      cursor:pointer;
      z-index: 10;
    ">&times;</span>
    <img id="modalImg" src="" style="
      width:auto; 
      max-width:100%; 
      height:auto; 
      display:block; 
      border-radius:10px; 
      box-shadow:0 6px 20px rgba(0,0,0,0.4);
    ">
  </div>
`;
document.body.appendChild(modal);

// Modal close
const modalImg = document.getElementById("modalImg");
const modalClose = document.getElementById("modalClose");
function openModal(imgSrc) {
  if (!imgSrc) return;
  modalImg.src = imgSrc;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.style.display = "none";
  modalImg.src = "";
  document.body.style.overflow = "";
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

// CSS Animations
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInModal { from {opacity: 0;} to {opacity: 1;} }
@keyframes zoomIn { from {transform: scale(0.8); opacity: 0;} to {transform: scale(1); opacity: 1;} }
#modalContent { overflow: auto; }

/* Author overlay */
.project-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(37, 117, 252, 0.7);
  display: flex;
  flex-direction: column; /* stack actions + author */
  justify-content: space-between; /* actions top, author bottom */
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  padding: 12px;
  box-sizing: border-box;
}

.project-card:hover .project-overlay {
  opacity: 1;
}

.project-actions {
  z-index: 10; /* ensure buttons above overlay */
}

.project-author-overlay {
  position: relative; /* relative inside overlay */
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  opacity: 1; /* always visible once overlay shows */
}
`;
document.head.appendChild(style);

// Skeleton loader
function showSkeletonLoader(count = 6) {
  projectsGrid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("project-card", "skeleton-card");
    skeleton.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-meta"></div>
    `;
    projectsGrid.appendChild(skeleton);
  }
}

let allProjects = [];

// Load projects
async function loadProjects() {
  showSkeletonLoader();
  try {
    const snapshot = await db.collection("projects").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      projectsGrid.innerHTML = "<p style='text-align:center;'>No projects found.</p>";
      return;
    }
    allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    populateFilters();
    renderProjects(allProjects);
  } catch (err) {
    console.error("Error loading projects:", err);
    projectsGrid.innerHTML = "<p style='text-align:center;'>Error loading projects.</p>";
  }
}

// Populate filters
function populateFilters() {
  if (!categoryFilter || !tagFilter) return;
  const categories = [...new Set(allProjects.map(p => p.category))];
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const tags = [...new Set(allProjects.flatMap(p => p.tags || []))];
  tagFilter.innerHTML = '<option value="">All Tags</option>';
  tags.forEach(tag => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

// Render projects
function renderProjects(projects) {
  projectsGrid.innerHTML = '';
  if (projects.length === 0) {
    projectsGrid.innerHTML = "<p style='text-align:center;'>No projects found.</p>";
    return;
  }
  projects.forEach(data => {
    const card = document.createElement("div");
    card.classList.add("project-card");
    card.innerHTML = `
      <div class="project-img-wrapper">
        <img src="${data.imageURL}" alt="${data.title}" class="project-img" loading="lazy">
        <div class="project-overlay">
          <div class="project-actions">
            <a href="${data.githubURL}" target="_blank" class="btn-small">
              <i class="fa-solid fa-code"></i> Details
            </a>
            <button type="button" class="btn-small live-demo-btn" data-screenshot="${data.imageURL}">
              <i class="fa-solid fa-play"></i> Live Demo
            </button>
          </div>
          <div class="project-author-overlay">Created by <strong>Shouvik Dhali</strong></div>
        </div>
      </div>
      <div class="project-name">${data.title}</div>
      <div class="project-meta">
        ${Array.isArray(data.tags) ? data.tags.map(tag => `<span>${tag}</span>`).join('') : ''}
      </div>
    `;
    projectsGrid.appendChild(card);

    // ✅ JSON-LD for SEO
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": data.title,
      "creator": { "@type": "Person", "name": "Shouvik Dhali" },
      "description": data.description || "A project by Shouvik Dhali.",
      "url": window.location.origin + "/projects?id=" + data.id,
      "image": data.imageURL || "",
      "keywords": Array.isArray(data.tags) ? data.tags.join(", ") : ""
    });
    document.head.appendChild(script);
  });

  // Live demo
  projectsGrid.querySelectorAll(".live-demo-btn").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();
      const imgSrc = e.currentTarget.getAttribute("data-screenshot");
      openModal(imgSrc);
    });
  });
}

// Filter projects by search/category/tag
function filterProjects() {
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const selectedCategory = categoryFilter?.value || "";
  const selectedTag = tagFilter?.value || "";

  const filtered = allProjects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm) ||
      (p.description || '').toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const matchesTag = selectedTag ? (p.tags || []).includes(selectedTag) : true;
    return matchesSearch && matchesCategory && matchesTag;
  });

  renderProjects(filtered);
}

// Event listeners
searchInput?.addEventListener('input', filterProjects);
categoryFilter?.addEventListener('change', filterProjects);
tagFilter?.addEventListener('change', filterProjects);

// Initial load
loadProjects();
