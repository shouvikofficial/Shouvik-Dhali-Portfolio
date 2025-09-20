// blog.js
document.addEventListener('DOMContentLoaded', () => {
  loadBlogsFromFirestore();
});

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

  article.innerHTML = `
    <img src="${data.imageURL}" alt="${data.title}">
    <div class="post-content">
      <h2 class="post-title">${data.title}</h2>
      <div class="post-meta">
        <span class="author">Author : ${article.dataset.author}</span>
        <span class="date">${article.dataset.date}</span>
      </div>
      <p class="post-excerpt">${data.content.substring(0, 100)}...</p>
      <a href="#" class="read-more">Read More →</a>
      <div class="full-content" style="display:none;">
        ${data.content}
      </div>
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
}); // <-- THIS closes the forEach

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
      filteredPosts = allPosts.filter(post => {
        const cats = post.dataset.category ? post.dataset.category.split(',').map(s => s.trim()) : [];
        const tags = post.dataset.tags ? post.dataset.tags.split(',').map(s => s.trim()) : [];
        if (type === 'category') return cats.includes(value);
        if (type === 'tag') return tags.includes(value);
        return true;
      });
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

    // Modal functionality
    function createModal() {
      if (document.querySelector('.blog-modal')) return;
      const modal = document.createElement('div');
      modal.className = 'blog-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="modal-wrap" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-title"></div>
            <button class="modal-close" aria-label="Close">✕</button>
          </div>
          <div class="modal-content-wrapper">
            <img class="modal-image" src="" alt="" style="display:none;">
            <div class="modal-body"></div>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modal.querySelector('.modal-close').addEventListener('click', closeModal);
      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    }

    function openModal() {
      const modal = document.querySelector('.blog-modal');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      const modal = document.querySelector('.blog-modal');
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function populateModalFromPost(post) {
      createModal();
      const modal = document.querySelector('.blog-modal');
      const titleEl = modal.querySelector('.modal-title');
      const bodyEl = modal.querySelector('.modal-body');
      const imgEl = modal.querySelector('.modal-image');

      const titleNode = post.querySelector('.post-title') || post.querySelector('.featured-title');
      titleEl.textContent = titleNode ? titleNode.textContent : '';

      const imgNode = post.querySelector('img');
      if (imgNode) {
        imgEl.src = imgNode.src;
        imgEl.alt = imgNode.alt || titleEl.textContent;
        imgEl.style.display = 'block';
      }

      const metaNode = post.querySelector('.post-meta');
      const fullNode = post.querySelector('.full-content');
      bodyEl.innerHTML = `
        ${metaNode ? metaNode.outerHTML : ''}
        ${fullNode ? fullNode.innerHTML : ''}
      `;

      openModal();
    }

    function initBlogModals() {
      document.body.addEventListener('click', e => {
        const rm = e.target.closest('.read-more');
        if (!rm) return;
        e.preventDefault();
        const post = rm.closest('.blog-post') || rm.closest('.featured-post');
        if (post) {
          populateModalFromPost(post);
        }
      });
    }

    // Filter events
    categoryLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      filterPosts('category', link.textContent.trim());
    }));
    tagLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      filterPosts('tag', link.textContent.trim());
    }));

    // Start blog with first page and modal enabled
    showPage(1);
    initBlogModals();

  } catch (err) {
    console.error("Error fetching blogs:", err);
    postsContainer.innerHTML = "<p>Error loading blogs.</p>";
  }
}

// Add 'selected' class functionality
const tags = document.querySelectorAll('.tags a');
tags.forEach(tag => {
  tag.addEventListener('click', (e) => {
    e.preventDefault();
    tags.forEach(t => t.classList.remove('selected'));
    tag.classList.add('selected');
  });
});

const categoryLinks = document.querySelectorAll('.sidebar-widget ul li a');
categoryLinks.forEach(cat => {
  cat.addEventListener('click', (e) => {
    e.preventDefault();
    categoryLinks.forEach(c => c.classList.remove('selected'));
    cat.classList.add('selected');
  });
});
