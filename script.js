// ========================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ========================================
// HERO ANIMATIONS ON LOAD
// ========================================

window.addEventListener('load', () => {
  // Trigger hero animations with a slight delay for page load
  setTimeout(() => {
    document.querySelector('.hero-greeting')?.classList.add('animate');
    document.querySelector('.hero-name')?.classList.add('animate');
    document.querySelector('.hero-tagline')?.classList.add('animate');
    document.querySelector('.hero-description')?.classList.add('animate');
    document.querySelector('.hero-links')?.classList.add('animate');
    document.querySelector('.hero-image')?.classList.add('animate');
  }, 100);
});

// ========================================
// SCROLL REVEAL ANIMATION
// ========================================

const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Optional: unobserve after animation to save resources
      // observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all section contents
document.querySelectorAll('.section-content').forEach(section => {
  observer.observe(section);
});

// Also observe contact content separately
document.querySelectorAll('.contact-content').forEach(section => {
  observer.observe(section);
});

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================

let lastScrollY = window.scrollY;
const nav = document.querySelector('.nav');
let navHidden = false;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  
  // Add shadow when scrolled
  if (currentScrollY > 50) {
    nav.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.3)';
  } else {
    nav.style.boxShadow = 'none';
  }
  
  // Hide/show navbar on scroll direction (optional - comment out if not wanted)
  /*
  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    nav.style.transform = 'translateY(-100%)';
  } else {
    nav.style.transform = 'translateY(0)';
  }
  */
  
  lastScrollY = currentScrollY;
});

// ========================================
// ACTIVE NAV LINK HIGHLIGHTING
// ========================================

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = '#00bfff';
    }
  });
});

// ========================================
// CURSOR GLOW EFFECT (Desktop Only)
// ========================================

if (window.innerWidth > 768) {
  const cursorGlow = document.createElement('div');
  cursorGlow.classList.add('cursor-glow');
  document.body.appendChild(cursorGlow);
  
  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Smooth follow animation
  function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    
    requestAnimationFrame(animateGlow);
  }
  
  animateGlow();
  
  // Hide glow when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
  });
  
  document.addEventListener('mouseenter', () => {
    cursorGlow.style.opacity = '1';
  });
}


// ========================================
// TYPING EFFECT FOR TAGLINE (Optional)
// ========================================

/*
function typeWriter(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// Uncomment to enable typing effect
// window.addEventListener('load', () => {
//   const tagline = document.querySelector('.hero-tagline');
//   const text = tagline.textContent;
//   setTimeout(() => typeWriter(tagline, text, 50), 600);
// });
*/

// ========================================
// PARALLAX EFFECT ON HERO IMAGE (Subtle)
// ========================================

if (window.innerWidth > 768) {
  const heroImage = document.querySelector('.hero-image-wrapper');
  
  if (heroImage) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const rate = scrolled * 0.1;
      
      if (scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${rate}px)`;
      }
    });
  }
}
// ========================================
// HERO IMAGE CAROUSEL
// ========================================

const carouselImages = document.querySelectorAll('.hero-carousel img');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let carouselInterval;

function showSlide(index) {
  carouselImages.forEach(img => img.classList.remove('active'));
  indicators.forEach(ind => ind.classList.remove('active'));
  
  currentSlide = index;
  if (currentSlide >= carouselImages.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = carouselImages.length - 1;
  
  carouselImages[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function startCarousel() {
  carouselInterval = setInterval(nextSlide, 4000);
}

// Click indicators to change slide
indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    showSlide(index);
    clearInterval(carouselInterval);
    startCarousel();
  });
});

// Pause on hover
const heroImageWrapper = document.querySelector('.hero-image-wrapper');
if (heroImageWrapper) {
  heroImageWrapper.addEventListener('mouseenter', () => {
    clearInterval(carouselInterval);
  });
  
  heroImageWrapper.addEventListener('mouseleave', () => {
    startCarousel();
  });
}

// Start carousel
if (carouselImages.length > 1) {
  startCarousel();
}

// ========================================
// HYBRID COLLISION: TEXT + BORDERS
// ========================================

let player = null;
let playerX = 100;
let playerY = 100;
let velocityX = 0;
let velocityY = 0;
let isOnGround = false;
let jumpCount = 0; 
let keys = {};
let gameLoop = null;

const GRAVITY = 0.8;
const MOVE_SPEED = 7;
const JUMP_FORCE = 15; 
const FRICTION = 0.8;
const MAX_JUMPS = 2; 

document.getElementById('spawn-character').addEventListener('click', () => {
  if (player) {
    player.remove();
    player = null;
    if (gameLoop) cancelAnimationFrame(gameLoop);
    return;
  }

  player = document.createElement('div');
  player.className = 'player';
  Object.assign(player.style, {
    position: 'fixed',
    width: '32px',
    height: '32px',
    backgroundColor: '#00bfff',
    borderRadius: '4px',
    zIndex: '10000',
    pointerEvents: 'none',
    boxShadow: '0 0 15px rgba(0, 191, 255, 0.6)',
    border: '2px solid white'
  });
  
  document.body.appendChild(player);
  playerX = window.innerWidth / 2;
  playerY = 50;
  runGameLoop();
});

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if ((e.key === 'ArrowUp' || e.key === ' ' || e.key.toLowerCase() === 'w') && jumpCount < MAX_JUMPS) {
    velocityY = -JUMP_FORCE;
    isOnGround = false;
    jumpCount++;
  }
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => keys[e.key] = false);

function runGameLoop() {
  if (!player) return;

  // Horizontal Movement
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    velocityX = -MOVE_SPEED;
    player.style.transform = `scaleX(-1)`;
  } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    velocityX = MOVE_SPEED;
    player.style.transform = `scaleX(1)`;
  } else {
    velocityX *= FRICTION;
  }

  velocityY += GRAVITY;
  playerX += velocityX;
  playerY += velocityY;

  // Screen wrap & respawn
  if (playerX < -32) playerX = window.innerWidth;
  if (playerX > window.innerWidth) playerX = -32;
  if (playerY > window.innerHeight + 100) {
    playerY = -50;
    playerX = window.innerWidth / 2;
    velocityY = 0;
  }

  let groundedThisFrame = false;
  const isDropping = keys['ArrowDown'] || keys['s'] || keys['S'];

  if (!isDropping) {
    // 1. SELECT EVERYTHING THAT SHOULD BE SOLID
    // We target text elements AND all the "box" containers from your HTML
    const platforms = document.querySelectorAll(
      'h1, h2, h3, p, li, span, a, button, img, ' + 
      '.project-card, .skill-category, .experience-item, ' +
      '.nav-content, .hero-image-border, .contact-button'
    );
    
    platforms.forEach(el => {
      let rect;
      
      // LOGIC: If it's a card, button, or image, use the FULL box (including borders/padding)
      const isBox = el.matches('.project-card, .skill-category, .experience-item, .nav-content, .hero-image-border, button, .contact-button, img');
      
      if (!isBox && el.childNodes.length > 0) {
        // If it's just raw text (h1, p, etc.), use the precision range to avoid floating in white space
        const range = document.createRange();
        range.selectNodeContents(el);
        rect = range.getBoundingClientRect();
      } else {
        // For containers and cards, use the actual visual box
        rect = el.getBoundingClientRect();
      }

      const pWidth = 32;
      const pHeight = 32;

      // Ensure the box isn't a giant empty section (Safety check)
      if (rect.width > 0 && rect.height > 0 && rect.height < window.innerHeight * 0.9) {
        if (playerX + pWidth > rect.left && playerX < rect.right) {
          if (
            velocityY > 0 && 
            playerY + pHeight >= rect.top && 
            playerY + pHeight <= rect.top + velocityY + 10
          ) {
            playerY = rect.top - pHeight;
            velocityY = 0;
            groundedThisFrame = true;
          }
        }
      }
    });
  }

  if (groundedThisFrame) {
    isOnGround = true;
    jumpCount = 0;
  } else {
    isOnGround = false;
  }

  player.style.left = playerX + 'px';
  player.style.top = playerY + 'px';

  gameLoop = requestAnimationFrame(runGameLoop);
}