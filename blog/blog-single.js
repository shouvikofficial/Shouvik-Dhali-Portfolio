document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blogId = urlParams.get('id');       // Required for fetching
  const blogSlug = urlParams.get('slug');   // Optional: for URL display/SEO
  const blogContainer = document.querySelector('.blog-container');

  if (!blogId) {
    blogContainer.innerHTML = "<p>Blog ID not provided.</p>";
    return;
  }

  // ----- Show skeleton while loading -----
  function showBlogSkeleton() {
    blogContainer.innerHTML = `
      <div class="blog-skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    `;
  }
  showBlogSkeleton();

  // ----- Linkify function -----
  function linkify(text) {
    if (!text) return "";
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;
    return text.replace(urlPattern, function(url) {
      let href = url;
      if (!href.startsWith("http")) {
        href = "https://" + href; // add https if missing
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  // ----- Auto format blog content -----
  function formatContent(text) {
    if (!text) return "";

    // Escape HTML to avoid script injection
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Headings: ## Heading → <h2>
    text = text.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Blockquotes: > text → <blockquote>
    text = text.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // Lists: - item → <ul><li>item</li></ul>
    text = text.replace(/^- (.+)$/gm, "<li>$1</li>");
    text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Paragraphs: double new line → <p>
    text = text.replace(/\n\s*\n/g, "</p><p>");

    // Wrap in paragraph if not already formatted
    if (!text.startsWith("<")) {
      text = "<p>" + text + "</p>";
    }

    // Finally, linkify
    return linkify(text);
  }

  // ----- Fetch blog from Firestore -----
  db.collection('blogs').doc(blogId).get()
    .then(doc => {
      if (!doc.exists) {
        blogContainer.innerHTML = "<p>Blog not found.</p>";
        return;
      }

      const data = doc.data();

      // Update page title and meta description dynamically
      document.title = data.title + " | Shouvik Dhali";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", data.content.substring(0, 150));
      }

      // ----- JSON-LD for SEO -----
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        },
        "headline": data.title || "Blog Post",
        "description": data.content ? data.content.substring(0, 150) : "Read this blog post for more details.",
        "image": data.imageURL || "https://shouvikdhali.vercel.app/img/profile.png",
        "author": {
          "@type": "Person",
          "name": data.author || "Unknown Author"
        },
        "publisher": {
          "@type": "Person",
          "name": "Shouvik",
          "logo": {
            "@type": "ImageObject",
            "url": "https://shouvikdhali.vercel.app/img/profile.png"
          }
        },
        "datePublished": data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        "dateModified": data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
        "keywords": data.tags ? data.tags.join(", ") : "blog, articles, web",
        "about": data.category || "General"
      };
      script.textContent = JSON.stringify(jsonLd, null, 2);
      document.head.appendChild(script);

      // ----- Render blog -----
      blogContainer.innerHTML = `
        <article class="blog-post">
          <h1>${data.title}</h1>
          <div class="post-meta">
            <span>Author: ${data.author || 'Unknown'}</span> |
            <span>Date: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
          </div>
          ${data.imageURL ? `<img src="${data.imageURL}" alt="${data.title}" class="blog-image">` : ''}
          <div class="blog-content">${formatContent(data.content)}</div>
        </article>
      `;

      // ----- Add Back button at the bottom -----
      const backButton = document.createElement('button');
      backButton.className = 'back-button';
      backButton.textContent = '← Go Back';
      backButton.addEventListener('click', () => window.history.back());
      blogContainer.appendChild(backButton);
    })
    .catch(err => {
      console.error("Error loading blog:", err);
      blogContainer.innerHTML = "<p>Error loading blog.</p>";
    });
});