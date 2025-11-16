// blog.js
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedPost();          // ⭐ Load Featured Post First
  loadBlogsFromFirestore();    // Load other blogs
});

// ----- Slug generator -----
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // replace spaces & symbols with -
    .replace(/^-+|-+$/g, '');      // remove leading/trailing dashes
}

// ----- JSON-LD Function -----
function addJSONLD(blog) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "author": {
      "@type": "Person",
      "name": blog.author || "Unknown"
    },
    "datePublished": blog.date || new Date().toISOString(),
    "dateModified": blog.date || new Date().toISOString(),
    "image": blog.imageURL || "",
    "publisher": {
      "@type": "Person",
      "name": "Shouvik Dhali",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shouvikdhali.vercel.app/img/profile.png"
      }
    },
    "description": blog.content ? blog.content.substring(0, 150) : "",
    "keywords": blog.tags && blog.tags.length ? blog.tags.join(", ") : "",
    "about": blog.category || ""
  });
  document.head.appendChild(script);
}

/* ---------- NEW: Load Featured Post ---------- */
/* ---------- NEW: Load Featured Post ---------- */
async function loadFeaturedPost() {
  const section = document.getElementById("featured-post-section");
  if (!section) return;

  const skeleton = section.querySelector(".fp-skeleton");   // FIXED
  const img = section.querySelector(".featured-image");
  const contentBox = section.querySelector(".featured-content");
  const titleEl = section.querySelector(".featured-title");
  const excerptEl = section.querySelector(".featured-excerpt");
  const readMoreBtn = section.querySelector(".read-more");

  // Show skeleton, hide content
  skeleton.style.display = "block";
  img.style.display = "none";
  contentBox.style.display = "none";

  try {
    const snap = await db.collection("blogs")
      .where("featured", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      section.style.display = "none";
      return;
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const slug = generateSlug(data.title);

    img.src = data.imageURL || "/img/placeholder.jpg";
    titleEl.textContent = data.title;
    excerptEl.textContent = (data.content || "").substring(0, 150) + "...";
    readMoreBtn.href = `/blog/blog.html?slug=${slug}&id=${doc.id}`;

    // Hide skeleton, show real content
    skeleton.style.display = "none";
    img.style.display = "block";
    contentBox.style.display = "block";

  } catch (error) {
    console.error("Error loading featured post:", error);
    skeleton.style.display = "none";
  }
}


/* ---------- SKELETON HELPERS ---------- */
function renderSkeletons(count = 4) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    `;
  }
  return html;
}

/* ---------- MAIN: loadBlogsFromFirestore ---------- */
async function loadBlogsFromFirestore() {
  const postsContainer = document.querySelector('.blog-posts');
  const paginationContainer = document.querySelector('.pagination');
  const recentPostsContainer = document.querySelector('.recent-posts');
  const categoryLinks = document.querySelectorAll('.sidebar-widget:nth-child(1) ul li a');
  const tagLinks = document.querySelectorAll('.tags a');

  if (!postsContainer) return;

  // show skeletons while fetching
  postsContainer.innerHTML = renderSkeletons(4);

  try {
    const snapshot = await db.collection('blogs')
      .orderBy('createdAt', 'desc')
      .get();

    postsContainer.innerHTML = '';
    const allPosts = [];

    if (snapshot.empty) {
      postsContainer.innerHTML = "<p>No blogs found.</p>";
      return;
    }

    snapshot.forEach((doc, idx) => {
      const data = doc.data();

      const article = document.createElement('article');
      article.className = 'blog-post reveal';
      article.id = 'post-' + (idx + 1);
      article.dataset.category = data.category || '';
      article.dataset.tags = data.tags || '';
      article.dataset.author = data.author || 'Unknown';
      article.dataset.date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : '';

      const slug = generateSlug(data.title);

      article.innerHTML = `
        <img src="${data.imageURL}" alt="${data.title}">
        <div class="post-content">
          <h2 class="post-title">${data.title}</h2>
          <div class="post-meta">
            <span class="author">Author : ${article.dataset.author}</span>
            <span class="date">${article.dataset.date}</span>
          </div>
          <p class="post-excerpt">${data.content.substring(0, 100)}...</p>
          <a href="/blog/blog.html?slug=${slug}&id=${doc.id}" class="read-more">Read More →</a>
        </div>
      `;

      postsContainer.appendChild(article);
      allPosts.push(article);

      // Add JSON-LD
      const blogData = {
        title: data.title,
        author: data.author || "Unknown",
        date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        imageURL: data.imageURL || "",
        content: data.content || "",
        category: data.category ? data.category.toString() : "",
        tags: data.tags
          ? (Array.isArray(data.tags) ? data.tags : data.tags.toString().split(',').map(t => t.trim()))
          : []
      };
      addJSONLD(blogData);
    });

    // Pagination & filtering
    const postsPerPage = 4;
    let currentPage = 1;
    let filteredPosts = allPosts.slice();

    function showPage(page) {
      currentPage = page;
      const start = (page - 1) * postsPerPage;
      const end = start + postsPerPage;

      allPosts.forEach(p => p.style.display = 'none');
      filteredPosts.slice(start, end).forEach(p => p.style.display = 'block');

      updatePagination();
      updateRecentPosts();
    }

    function updatePagination() {
      paginationContainer.innerHTML = '';
      const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

      const prev = document.createElement('a');
      prev.href = '#';
      prev.textContent = '« Previous';
      prev.addEventListener('click', e => {
        e.preventDefault();
        if (currentPage > 1) showPage(currentPage - 1);
      });
      paginationContainer.appendChild(prev);

      for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i === currentPage) pageLink.classList.add('active');
        pageLink.addEventListener('click', e => {
          e.preventDefault();
          showPage(i);
        });
        paginationContainer.appendChild(pageLink);
      }

      const next = document.createElement('a');
      next.href = '#';
      next.textContent = 'Next »';
      next.addEventListener('click', e => {
        e.preventDefault();
        if (currentPage < totalPages) showPage(currentPage + 1);
      });
      paginationContainer.appendChild(next);
    }

    function filterPosts(type, value) {
      const val = value.toLowerCase();

      if (val === 'all') {
        filteredPosts = allPosts.slice();
      } else {
        filteredPosts = allPosts.filter(post => {
          const cats = post.dataset.category
            ? post.dataset.category.split(',').map(s => s.trim().toLowerCase())
            : [];
          const tags = post.dataset.tags
            ? post.dataset.tags.split(',').map(s => s.trim().toLowerCase())
            : [];
          if (type === 'category') return cats.includes(val);
          if (type === 'tag') return tags.includes(val);
          return true;
        });
      }
      showPage(1);
    }

    function updateRecentPosts() {
      if (!recentPostsContainer) return;
      recentPostsContainer.innerHTML = '';
      const recent = filteredPosts.slice(0, 5);
      recent.forEach(post => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + post.id;
        a.textContent = post.querySelector('.post-title')?.textContent;

        a.addEventListener('click', e => {
          e.preventDefault();
          const idx = filteredPosts.indexOf(post);
          if (idx !== -1) {
            const page = Math.floor(idx / postsPerPage) + 1;
            showPage(page);
            setTimeout(() => document.getElementById(post.id).scrollIntoView({ behavior: 'smooth' }), 120);
          }
        });
        li.appendChild(a);
        recentPostsContainer.appendChild(li);
      });
    }

    categoryLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      categoryLinks.forEach(c => c.classList.remove('selected'));
      link.classList.add('selected');
      filterPosts('category', link.textContent.trim());
    }));

    tagLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      tagLinks.forEach(t => t.classList.remove('selected'));
      link.classList.add('selected');
      filterPosts('tag', link.textContent.trim());
    }));

    const allTagLink = Array.from(tagLinks).find(l => l.textContent.trim().toLowerCase() === 'all');
    if (allTagLink) {
      allTagLink.addEventListener('click', e => {
        e.preventDefault();
        tagLinks.forEach(t => t.classList.remove('selected'));
        allTagLink.classList.add('selected');
        filterPosts('tag', 'all');
      });
    }

    showPage(1);

  } catch (err) {
    console.error("Error fetching blogs:", err);
    postsContainer.innerHTML = "<p>Error loading blogs.</p>";
  }
}
