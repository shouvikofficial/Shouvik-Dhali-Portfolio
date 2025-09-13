document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  //const hamburger = document.getElementById('hamburger');
  //const nav = document.getElementById('nav');
  const yearEl = document.getElementById('year');
  const revealEls = document.querySelectorAll('.reveal');

  // 1) Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 2) Theme init (remember)
  const savedTheme = localStorage.getItem('site-theme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('site-theme', next);
    updateThemeIcon(next);
  });
  function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
  }

  // 3) Mobile nav toggle
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile navbar
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  nav.classList.toggle('mobile-active');
  void nav.offsetWidth; // force reflow
  nav.classList.toggle('show');
});

// Close navbar and navigate properly
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    if (nav.classList.contains('mobile-active')) {
      // Prevent default to handle animation first
      e.preventDefault();
      const target = link.href;

      // Close the navbar
      hamburger.classList.remove('active');
      nav.classList.remove('show');
      nav.classList.remove('mobile-active');

      // Wait for transition to finish before navigating
      setTimeout(() => {
        window.location.href = target;
      }, 300); // match your CSS transition time
    }
  });
});


  // 4) Smooth internal scroll
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

  // 5) Typing effect
  const roles = ["Web Developer", "AI Enthusiast", "CSE Student", "Problem Solver"];
  let roleIdx = 0, charIdx = 0, deleting = false;
  const typingEl = document.getElementById('typing');

  if (typingEl) {
    (function typeLoop() {
      const current = roles[roleIdx];
      if (!deleting) {
        typingEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) {
          setTimeout(() => deleting = true, 900);
        }
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

  // 6) Reveal on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

  // 7) Skill fill animation
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

  // 9) Respect reduced motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) {
    document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible'));
    document.querySelectorAll('.skill-fill').forEach(f => f.style.transition = 'none');
  }
});

// Animate project cards on scroll
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

// Initialize Firebase
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



// Track visitor
async function trackVisitor() {
  try {
    await db.collection("visitors").add({
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Visitor tracked!");
  } catch (err) {
    console.error("Error tracking visitor:", err);
  }
}

// Track active user
async function trackActiveUser(userId) {
  try {
    await db.collection("activeUsers").doc(userId).set({
      lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Error tracking active user:", err);
  }
}

// Generate unique visitor ID and track active user
let visitorId = localStorage.getItem("visitorId");
if(!visitorId){
  visitorId = "visitor_" + Date.now();
  localStorage.setItem("visitorId", visitorId);
}
trackActiveUser(visitorId);
setInterval(() => trackActiveUser(visitorId), 60000);

// Call trackVisitor on page load
window.addEventListener("load", trackVisitor);

// Form handling
const form2 = document.getElementById("contact-form");
const formMsg2 = document.getElementById("form-msg");

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
      name,
      email,
      message,
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

