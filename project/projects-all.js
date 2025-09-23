// DOM Elements
const projectsContainer = document.getElementById("projectsContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const tagFilter = document.getElementById("tagFilter");
const modal = document.getElementById("screenshotModal");
const modalImg = document.getElementById("modalImg");
const modalClose = document.getElementById("modalClose");

let allProjects = [];

// ✅ Ensure modal is hidden on page load
window.addEventListener('DOMContentLoaded', () => {
  modal.style.display = "none"; // hidden initially
  modalImg.src = "";            // clear image
  document.body.classList.remove("no-scroll"); // ensure scroll enabled
});

// Open modal
function openModal(imgSrc) {
  if (!imgSrc) return; // safeguard if no image
  modalImg.src = imgSrc;
  modal.style.display = "flex";
  document.body.classList.add("no-scroll"); // prevent background scroll
  modal.scrollTop = 0;
}

// Close modal
function closeModal() {
  modal.style.display = "none";
  modalImg.src = "";
  document.body.classList.remove("no-scroll");
}

// Close events
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => {
  if (e.target === modal) closeModal();
});

// 🔹 Skeleton loader
function showSkeletonLoader(count = 6) {
  projectsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("project-card", "skeleton-card");
    skeleton.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-meta"></div>
    `;
    projectsContainer.appendChild(skeleton);
  }
}

// Load projects from Firebase
async function loadProjects() {
  showSkeletonLoader(); // show placeholders
  try {
    const snapshot = await db.collection("projects").orderBy("createdAt", "desc").get();
    if (snapshot.empty) {
      projectsContainer.innerHTML = "<p style='text-align:center;'>No projects found.</p>";
      return;
    }

    allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    populateFilters();
    renderProjects(allProjects);

  } catch (err) {
    console.error("Error loading projects:", err);
    projectsContainer.innerHTML = "<p style='text-align:center;'>Error loading projects.</p>";
  }
}

// Populate filters
function populateFilters() {
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
  projectsContainer.innerHTML = '';
  if (projects.length === 0) {
    projectsContainer.innerHTML = "<p style='text-align:center;'>No projects found.</p>";
    return;
  }

  projects.forEach(data => {
    const card = document.createElement("div");
    card.classList.add("project-card");
    card.innerHTML = `
      <div class="project-img-wrapper">
        <img src="${data.imageURL}" alt="${data.title} project by Shouvik Dhali" class="project-img" loading="lazy">
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
    projectsContainer.appendChild(card);

    // JSON-LD for SEO
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": data.title,
      "creator": {
        "@type": "Person",
        "name": "Shouvik Dhali"
      },
      "description": data.description || "A project by Shouvik Dhali.",
      "url": window.location.origin + "/projects?id=" + data.id,
      "image": data.imageURL || ""
    });
    document.head.appendChild(script);
  });

  // Add click events for live demo buttons
  projectsContainer.querySelectorAll(".live-demo-btn").forEach(button => {
    button.addEventListener("click", e => {
      e.preventDefault();
      const imgSrc = e.currentTarget.getAttribute("data-screenshot");
      openModal(imgSrc);
    });
  });
}

// Search & filter
function filterProjects() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedTag = tagFilter.value;
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
searchInput.addEventListener('input', filterProjects);
categoryFilter.addEventListener('change', filterProjects);
tagFilter.addEventListener('change', filterProjects);

// Load projects
loadProjects();