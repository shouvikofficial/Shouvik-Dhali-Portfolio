// blog.js
document.addEventListener('DOMContentLoaded', () => {
  loadBlogsFromFirestore();
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
      "@type": "Organization",
      "name": "Your Website Name",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    },
    "description": blog.content ? blog.content.substring(0, 150) : "",
    "keywords": blog.tags && blog.tags.length ? blog.tags.join(", ") : "",
    "about": blog.category || ""
  });
  document.head.appendChild(script);
}

async function loadBlogsFromFirestore() {
  const postsContainer = document.querySelector('.blog-posts');
  const paginationContainer = document.querySelector('.pagination');
  const recentPostsContainer = document.querySelector('.recent-posts');
  const categoryLinks = document.querySelectorAll('.sidebar-widget:nth-child(1) ul li a');
  const tagLinks = document.querySelectorAll('.tags a');

  if (!postsContainer) return;

  try {
    const snapshot = await db.collection('blogs').orderBy('createdAt', 'desc').get();
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

      // Generate slug from title
      const slug = generateSlug(data.title);

      // Updated "Read More" link with slug + id
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

      // ----- Add JSON-LD for this post -----
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
    }); // <-- forEach ends

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
      if (!paginationContainer) return;
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

    // Filter events
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

    // Handle "All" tag
    const allTagLink = Array.from(tagLinks).find(l => l.textContent.trim().toLowerCase() === 'all');
    if (allTagLink) {
      allTagLink.addEventListener('click', e => {
        e.preventDefault();
        tagLinks.forEach(t => t.classList.remove('selected'));
        allTagLink.classList.add('selected');
        filterPosts('tag', 'all');
      });
    }

    // Start blog with first page
    showPage(1);

  } catch (err) {
    console.error("Error fetching blogs:", err);
    postsContainer.innerHTML = "<p>Error loading blogs.</p>";
  }
}
