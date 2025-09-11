document.addEventListener('DOMContentLoaded', () => {

  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const yearEl = document.getElementById('year');
  const revealEls = document.querySelectorAll('.reveal');

  // ---------- 1) Footer year ----------
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 2) Theme init ----------
  const savedTheme = localStorage.getItem('site-theme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('site-theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // ---------- 3) Mobile nav toggle ----------
  hamburger?.addEventListener('click', () => {
    nav.classList.toggle('show');
    const expanded = nav.classList.contains('show');
    hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) nav.classList.remove('show');
    });
  });

  // ---------- 4) Smooth scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- 5) Typing effect ----------
  const roles = ["Web Developer", "AI Enthusiast", "CSE Student", "Problem Solver"];
  let roleIdx = 0, charIdx = 0, deleting = false;
  const typingEl = document.getElementById('typing');

  if (typingEl) {
    (function typeLoop() {
      const current = roles[roleIdx];
      if (!deleting) {
        typingEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) setTimeout(() => deleting = true, 900);
      } else {
        typingEl.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting = false;
          roleIdx = (roleIdx + 1) % roles.length;
        }
      }
      setTimeout(typeLoop, deleting ? 50 : 120);
    })();
  }

  // ---------- 6) Reveal on scroll ----------
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

  // ---------- 7) Skill fill animation ----------
  const skills = document.querySelectorAll('.skill');
  const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.skill-fill');
        if (fill) fill.classList.add('filled');
      }
    });
  }, { threshold: 0.25 });
  skills.forEach(s => skillObserver.observe(s));

  // ---------- 8) Respect reduced motion ----------
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'));
    document.querySelectorAll('.skill-fill').forEach(f => f.style.transition = 'none');
  }

  // ---------- 9) Project card animation ----------
  const projectCards = document.querySelectorAll('.project-card');
  const observerProjects = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('fade-in');
        observerProjects.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  projectCards.forEach(card => observerProjects.observe(card));

  // ---------- 10) Firebase init ----------
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
  const db = firebase.firestore();

  // ---------- 11) Blog pagination & modal ----------
  const postsContainer = document.querySelector('.blog-posts');
  const paginationContainer = document.querySelector('.pagination');
  const recentPostsContainer = document.querySelector('.recent-posts');
  const postsPerPage = 4;
  let currentPage = 1;
  let allPosts = [];

  function addStaticPosts() {
    const staticPosts = Array.from(postsContainer.querySelectorAll('.blog-post, .featured-post'));
    staticPosts.forEach((p, idx) => { if (!p.id) p.id = 'post-' + (idx + 1); });
    allPosts = staticPosts.slice();
  }

  function updatePaginationAndRecent() {
    // Pagination
    paginationContainer.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(allPosts.length / postsPerPage));

    const prev = document.createElement('a');
    prev.href = '#'; prev.textContent = '« Previous';
    prev.addEventListener('click', e => { e.preventDefault(); if (currentPage > 1) showPage(currentPage - 1); });
    paginationContainer.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const pageLink = document.createElement('a');
      pageLink.href = '#'; pageLink.textContent = i;
      if (i === currentPage) pageLink.classList.add('active');
      pageLink.addEventListener('click', e => { e.preventDefault(); showPage(i); });
      paginationContainer.appendChild(pageLink);
    }

    const next = document.createElement('a');
    next.href = '#'; next.textContent = 'Next »';
    next.addEventListener('click', e => { e.preventDefault(); if (currentPage < totalPages) showPage(currentPage + 1); });
    paginationContainer.appendChild(next);

    // Recent posts
    recentPostsContainer.innerHTML = '';
    allPosts.slice(0, 5).forEach(post => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + post.id;
      a.textContent = post.querySelector('.post-title')?.textContent || post.querySelector('.featured-title')?.textContent;
      a.addEventListener('click', e => {
        e.preventDefault();
        const idx = allPosts.indexOf(post);
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

  function showPage(page) {
    currentPage = page;
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    allPosts.forEach(p => p.style.display = 'none');
    allPosts.slice(start, end).forEach(p => p.style.display = 'block');
    updatePaginationAndRecent();
  }

  function initBlogModals() {
    const posts = allPosts;
    posts.forEach(post => {
      const readMore = post.querySelector('.read-more');
      if (!readMore) return;
      readMore.addEventListener('click', e => {
        e.preventDefault();
        createAndShowModal(post);
      });
    });
  }

  function createAndShowModal(post) {
    let modal = document.querySelector('.blog-modal');
    if (!modal) {
      modal = document.createElement('div');
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

    const titleEl = modal.querySelector('.modal-title');
    const bodyEl = modal.querySelector('.modal-body');
    const imgEl = modal.querySelector('.modal-image');

    titleEl.textContent = post.querySelector('.post-title')?.textContent || post.querySelector('.featured-title')?.textContent || '';
    const imgNode = post.querySelector('img');
    if (imgNode) {
      imgEl.src = imgNode.src;
      imgEl.alt = imgNode.alt || titleEl.textContent;
      imgEl.style.display = 'block';
    }
    const fullNode = post.querySelector('.full-content');
    bodyEl.innerHTML = fullNode ? fullNode.innerHTML : post.innerHTML;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.querySelector('.blog-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // ---------- Initialize static posts ----------
  addStaticPosts();
  showPage(1);
  initBlogModals();

  // ---------- 12) Fetch Firestore blogs ----------
  if (postsContainer) {
    db.collection('blogs').orderBy('createdAt', 'desc').get()
      .then(snapshot => {
        if (!snapshot.empty) {
          snapshot.forEach(doc => {
            const data = doc.data();
            const article = document.createElement('article');
            article.className = 'blog-post reveal';
            article.innerHTML = `
              <img src="${data.imageURL || 'default.jpg'}" alt="${data.title}">
              <div class="post-content">
                <h2 class="post-title">${data.title}</h2>
                <p class="post-excerpt">${data.excerpt}</p>
                <a href="#" class="read-more">Read More →</a>
                <div class="full-content" style="display:none;">
                  ${data.content}
                </div>
              </div>
            `;
            article.id = 'post-' + (allPosts.length + 1);
            postsContainer.appendChild(article);
            allPosts.push(article);
          });

          initBlogModals();
          showPage(currentPage);
        }
      })
      .catch(err => console.error('Error fetching blogs:', err));
  }

  // ---------- 13) Contact form ----------
  const form2 = document.getElementById("contact-form");
  const formMsg2 = document.getElementById("form-msg");
  if (form2) {
    form2.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();
      if(!name || !email || !message){
        formMsg2.textContent = "Please fill all fields.";
        formMsg2.style.color = "red";
        return;
      }
      try {
        await db.collection("messages").add({
          name, email, message,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formMsg2.textContent = "Message sent successfully!";
        formMsg2.style.color = "green";
        form2.reset();
      } catch (err) {
        formMsg2.textContent = "Error sending message. Try again.";
        formMsg2.style.color = "red";
        console.error(err);
      }
    });
  }

}); // End DOMContentLoaded
