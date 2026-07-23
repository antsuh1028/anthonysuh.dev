// ========================================
// SITE MODE - professional (default) vs playground/fun
// The playground layer (Mii, snow, hunt, cursor FX...) only runs in fun mode.
// ========================================

const FUN = document.documentElement.dataset.mode === 'fun';

(function initModeToggle() {
  const btn = document.getElementById('mode-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    try {
      localStorage.setItem('siteMode', FUN ? 'pro' : 'fun');
    } catch (e) { /* ignore */ }
    location.reload(); // reload so every heavy effect starts/stops cleanly
  });
})();

// ========================================
// SCROLL PROGRESS BAR
// ========================================

const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  scrollProgress.style.width = (scrollTop / scrollHeight * 100) + '%';
}, { passive: true });

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

  // Add shadow when scrolled (nav is currently replaced by the dock, so guard)
  if (nav) {
    if (currentScrollY > 50) {
      nav.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.3)';
    } else {
      nav.style.boxShadow = 'none';
    }
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
const navLinks = document.querySelectorAll('.nav-links a, .dock-panel a[href^="#"]');

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
// CURSOR GLOW EFFECT - replaced by the pixel wind trail (see CURSOR FX below)
// ========================================

/*
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

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  document.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursorGlow.style.opacity = '1'; });
}
*/


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
        // keep the polaroid tilt while parallaxing
        heroImage.style.transform = `translateY(${rate}px) rotate(2.5deg)`;
      }
    });
  }
}
// ========================================
// HERO IMAGE CAROUSEL
// ========================================

const carouselImages = document.querySelectorAll('.hero-carousel img');
const indicators = document.querySelectorAll('.indicator');
const CAROUSEL_CAPTIONS = ['graduation', 'seattle', 'downtown', 'tokyo', 'skytree'];
let carouselCaption = null;
let currentSlide = 0;
let carouselInterval;

// caption chip in the corner of the photo
(function initCarouselCaption() {
  const wrapper = document.querySelector('.hero-image-wrapper');
  if (!wrapper) return;
  carouselCaption = document.createElement('div');
  carouselCaption.className = 'carousel-caption';
  carouselCaption.textContent = CAROUSEL_CAPTIONS[0];
  wrapper.appendChild(carouselCaption);
})();

function showSlide(index) {
  carouselImages.forEach(img => img.classList.remove('active'));
  indicators.forEach(ind => ind.classList.remove('active'));

  currentSlide = index;
  if (currentSlide >= carouselImages.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = carouselImages.length - 1;

  carouselImages[currentSlide].classList.add('active');
  indicators[currentSlide].classList.add('active');
  if (carouselCaption) carouselCaption.textContent = CAROUSEL_CAPTIONS[currentSlide] || '';
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function startCarousel() {
  carouselInterval = setInterval(nextSlide, 4000);
}

indicators.forEach((indicator, index) => {
  indicator.addEventListener('click', () => {
    showSlide(index);
    clearInterval(carouselInterval);
    startCarousel();
  });
});

const heroImageWrapper = document.querySelector('.hero-image-wrapper');
if (heroImageWrapper) {
  heroImageWrapper.addEventListener('mouseenter', () => {
    clearInterval(carouselInterval);
  });

  heroImageWrapper.addEventListener('mouseleave', () => {
    startCarousel();
  });
}

if (carouselImages.length > 1) {
  startCarousel();
}

// ========================================
// ANALYTICS EVENTS (GoatCounter) - what visitors actually engage with
// ========================================

const sentEvents = new Set();

// once = true sends the event at most once per page visit
function trackEvent(name, once = false) {
  if (once && sentEvents.has(name)) return;
  sentEvents.add(name);
  if (window.goatcounter && window.goatcounter.count) {
    window.goatcounter.count({ path: name, title: name, event: true });
  }
}

// resume opens (hero button + dock icon)
document.querySelectorAll('a[href*="AnthonySuh_Resume.pdf"]').forEach(a => {
  a.addEventListener('click', () => trackEvent('resume-view'));
});

// hero social icons
document.querySelectorAll('.hero-links a[href*="github.com"]').forEach(a => {
  a.addEventListener('click', () => trackEvent('social-github'));
});
document.querySelectorAll('.hero-links a[href*="linkedin.com"]').forEach(a => {
  a.addEventListener('click', () => trackEvent('social-linkedin'));
});

// devpost / github clicks per project (the icon links)
document.querySelectorAll('.project-card').forEach(card => {
  const title = (card.querySelector('.project-title')?.textContent || 'project')
    .trim().toLowerCase().replace(/\s+/g, '-');
  card.querySelectorAll('.project-links a').forEach(a => {
    const kind = a.href.includes('devpost') ? 'devpost'
      : a.href.includes('github.com') ? 'github'
      : 'demo';
    a.addEventListener('click', () => trackEvent(`${kind}-${title}`));
  });
});

// ========================================
// EMAIL COPY - mailto links copy the address instead, since many
// visitors have no desktop mail client configured
// ========================================

(function initEmailCopy() {
  const EMAIL = 'ant.suh1028@gmail.com';
  let toast = null;
  let toastTimer = null;

  function showCopyToast() {
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = 'copied: ' + EMAIL;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function copyEmail() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(showCopyToast, showCopyToast);
    } else {
      const t = document.createElement('textarea');
      t.value = EMAIL;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
      showCopyToast();
    }
  }

  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      copyEmail();
      trackEvent('email-copy', true);
    });
  });
})();

// ========================================
// EMBEDDED DEMO LIGHTBOX - open demos in an iframe modal, in-page
// ========================================

(function initEmbedModal() {
  const modal = document.getElementById('embed-modal');
  if (!modal) return;
  const wrap = modal.querySelector('.embed-frame-wrap');
  const titleEl = modal.querySelector('.embed-title');
  const openLink = modal.querySelector('.embed-open');

  function openEmbed(url, title) {
    titleEl.textContent = title || 'Live demo';
    openLink.href = url;
    // build the iframe only when opened so the demo isn't running in the background
    wrap.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.setAttribute('allow', 'clipboard-write; fullscreen');
    wrap.appendChild(iframe);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // freeze page scroll behind the modal
  }

  function closeEmbed() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = ''; // tear down the iframe so the demo stops
    document.body.style.overflow = '';
  }

  window.openEmbed = openEmbed; // let the card-click handler reuse it

  document.querySelectorAll('[data-embed]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openEmbed(a.href, a.getAttribute('data-embed'));
    });
  });

  modal.querySelector('.embed-close').addEventListener('click', closeEmbed);
  modal.querySelector('.embed-backdrop').addEventListener('click', closeEmbed);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeEmbed();
  });
})();

// ========================================
// PROJECT CARDS - whole card opens its primary link (demo in a modal, else new tab)
// ========================================

document.querySelectorAll('.project-card').forEach(card => {
  const link = card.querySelector('.project-links a');
  if (!link) return;
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // let the inner icon links work normally
    const title = (card.querySelector('.project-title')?.textContent || 'project')
      .trim().toLowerCase().replace(/\s+/g, '-');
    const kind = link.href.includes('devpost') ? 'devpost'
      : link.href.includes('github.com') ? 'github'
      : 'demo';
    trackEvent(`${kind}-${title}`);
    if (link.hasAttribute('data-embed') && window.openEmbed) {
      window.openEmbed(link.href, link.getAttribute('data-embed'));
    } else {
      window.open(link.href, '_blank', 'noopener');
    }
  });
});

// ========================================
// DOCK NAVIGATION - macOS-style magnification
// ========================================

(function initDock() {
  if (!FUN) return; // pro mode: dock still navigates, just no magnify flourish
  const panel = document.querySelector('.dock-panel');
  if (!panel) return;

  const items = Array.from(panel.querySelectorAll('.dock-item'));
  const BASE = 44;          // resting size (matches CSS)
  const MAG = 74;           // size under the cursor
  const DIST = 130;         // influence radius in px
  const targets = items.map(() => BASE);
  const sizes = items.map(() => BASE);
  let raf = null;

  function animate() {
    let settled = true;
    items.forEach((item, i) => {
      sizes[i] += (targets[i] - sizes[i]) * 0.25;
      if (Math.abs(targets[i] - sizes[i]) > 0.1) settled = false;
      item.style.width = sizes[i] + 'px';
      item.style.height = sizes[i] + 'px';
    });
    raf = settled ? null : requestAnimationFrame(animate);
  }

  function setTargets(mouseX) {
    items.forEach((item, i) => {
      if (mouseX === null) {
        targets[i] = BASE;
        return;
      }
      const rect = item.getBoundingClientRect();
      const d = Math.abs(mouseX - (rect.left + rect.width / 2));
      // smooth cosine falloff with distance from the cursor
      const factor = d >= DIST ? 0 : (Math.cos((d / DIST) * Math.PI) + 1) / 2;
      targets[i] = BASE + (MAG - BASE) * factor;
    });
    if (!raf) raf = requestAnimationFrame(animate);
  }

  panel.addEventListener('mousemove', (e) => setTargets(e.clientX));
  panel.addEventListener('mouseleave', () => setTargets(null));
})();

// ========================================
// BOUNCE CARDS (hero) - hover pushes siblings aside,
// hovered card straightens; springy CSS transitions do the bounce
// ========================================

(function initBounceCards() {
  // the polaroid fan runs in BOTH modes
  const wrap = document.getElementById('bounce-cards');
  if (!wrap) return;

  const cards = Array.from(wrap.querySelectorAll('.bounce-card'));
  const baseTransforms = cards.map(c => c.style.transform || 'none');
  const PUSH = 85; // 7 cards now - smaller push keeps the hover spread contained

  // Add an offset to an existing translateX, or append one
  function pushed(base, offset) {
    const m = base.match(/translateX\((-?[\d.]+)px\)/);
    if (m) {
      return base.replace(/translateX\(-?[\d.]+px\)/, `translateX(${parseFloat(m[1]) + offset}px)`);
    }
    return base === 'none' ? `translateX(${offset}px)` : `${base} translateX(${offset}px)`;
  }

  function straightened(base) {
    if (/rotate\([^)]*\)/.test(base)) return base.replace(/rotate\([^)]*\)/, 'rotate(0deg)');
    return base === 'none' ? 'rotate(0deg)' : `${base} rotate(0deg)`;
  }

  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      cards.forEach((sib, j) => {
        sib.style.transitionDelay = (Math.abs(j - i) * 0.05) + 's';
        sib.style.zIndex = j === i ? '3' : '1';
        sib.style.transform = j === i
          ? straightened(baseTransforms[j])
          : pushed(baseTransforms[j], j < i ? -PUSH : PUSH);
      });
    });

    card.addEventListener('mouseleave', () => {
      cards.forEach((sib, j) => {
        sib.style.transitionDelay = '0s';
        sib.style.transform = baseTransforms[j];
      });
    });
  });
})();

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

const GRAVITY = 0.4;
const MOVE_SPEED = 7;
const JUMP_FORCE = 11;
const FRICTION = 0.8;
const MAX_JUMPS = 2;

// ---- Coin system ----
let coins = [];
let coinScore = 0;
let coinDisplay = null;
let celebrating = false;

// Sit a coin on top of a given element at a random X within its bounds.
// Returns document-space {x, y} coords.
function coinDocPos(el) {
  const rect = el.getBoundingClientRect();
  const docTop = rect.top + window.scrollY;
  const docLeft = rect.left + window.scrollX;
  const x = docLeft + 8 + Math.random() * Math.max(rect.width - 32, 0);
  const y = docTop - 22; // sit just above the element surface
  return { x, y };
}

function spawnCoins() {
  coins.forEach(c => c.el.remove());
  coins = [];

  const targets = Array.from(document.querySelectorAll(
    '.project-card, .experience-item, .skill-category, ' +
    '.section-title, .hero-name, .hero-tagline, .contact-button'
  )).filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

  // Shuffle and pick one coin per element (up to 12)
  const picked = targets.sort(() => Math.random() - 0.5).slice(0, 12);

  picked.forEach(el => {
    const { x, y } = coinDocPos(el);
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.setProperty('--delay', (Math.random() * 2) + 's');
    coin.style.position = 'absolute';
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    document.body.appendChild(coin);
    coins.push({ el: coin, docX: x, docY: y, collected: false });
  });

  if (coinDisplay) updateCoinDisplay();
}

function removeCoins() {
  coins.forEach(c => c.el.remove());
  coins = [];
  if (coinDisplay) { coinDisplay.remove(); coinDisplay = null; }
  coinScore = 0;
}

function createCoinDisplay() {
  coinDisplay = document.createElement('div');
  coinDisplay.id = 'coin-display';
  document.body.appendChild(coinDisplay);
  updateCoinDisplay();
}

function updateCoinDisplay() {
  if (coinDisplay) coinDisplay.textContent = `❄ ${coinScore} / ${coins.length}`;
}

function checkCoinCollisions() {
  if (!player) return;
  const pRight = playerX + P_W, pBottom = playerY + P_H;

  coins.forEach(coin => {
    if (coin.collected) return;
    // Convert document coords → viewport coords for comparison with fixed player
    const vx = coin.docX - window.scrollX;
    const vy = coin.docY - window.scrollY;
    if (pRight > vx && playerX < vx + 16 && pBottom > vy && playerY < vy + 16) {
      coin.collected = true;
      coinScore++;
      updateCoinDisplay();
      coin.el.classList.add('coin-collect');
      setTimeout(() => coin.el.remove(), 400);
    }
  });

  if (!celebrating && coins.length > 0 && coins.every(c => c.collected)) {
    celebrating = true;
    celebrate();
    setTimeout(() => {
      if (player) { coinScore = 0; celebrating = false; spawnCoins(); updateCoinDisplay(); }
    }, 2200);
  }
}

function buildSnowman() {
  const wrap = document.createElement('div');
  wrap.className = 'snowman';

  // draw him tiny, then scale up with image-rendering: pixelated
  const c = document.createElement('canvas');
  c.width = 26;
  c.height = 32;
  const g = c.getContext('2d');
  const px = (x, y, color) => { g.fillStyle = color; g.fillRect(x, y, 1, 1); };
  const ball = (cx, cy, r) => {
    for (let x = 0; x < c.width; x++) {
      for (let y = 0; y < c.height; y++) {
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) {
          // darker rim on the lower-right for a hint of depth
          const shaded = (x + 0.5 - cx) * 0.6 + (y + 0.5 - cy) > r * 0.5;
          px(x, y, shaded ? '#c2d6ee' : '#e8f3ff');
        }
      }
    }
  };

  ball(13, 25, 6.2);  // base
  ball(13, 16, 4.8);  // middle
  ball(13, 8.5, 3.6); // head
  px(11, 7, '#1c2333');  px(14, 7, '#1c2333');   // eyes
  px(12, 9, '#f5a623');  px(13, 9, '#f5a623');   // carrot nose
  px(13, 15, '#1c2333'); px(13, 18, '#1c2333');  // coal buttons
  px(7, 14, '#6b4a2b');  px(6, 13, '#6b4a2b');  px(5, 12, '#6b4a2b');  // left stick arm
  px(19, 14, '#6b4a2b'); px(20, 13, '#6b4a2b'); px(21, 12, '#6b4a2b'); // right stick arm

  wrap.appendChild(c);
  // keep clear of the hunt button (bottom right) and test button (bottom left)
  wrap.style.left = (12 + Math.random() * 60) + 'vw';
  document.body.appendChild(wrap);
  const all = document.querySelectorAll('.snowman');
  if (all.length > 3) all[0].remove(); // keep at most three standing
}

// TEMP: test button for spawning snowmen - uncomment to test celebrate()
/*
(function addSnowmanTestButton() {
  const b = document.createElement('button');
  b.id = 'snowman-test';
  b.textContent = 'test snowman';
  Object.assign(b.style, {
    position: 'fixed', bottom: '24px', left: '24px', zIndex: '200',
    padding: '8px 12px', background: '#112240', color: '#bfe3ff',
    border: '1px solid #233554', borderRadius: '6px', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '0.8rem'
  });
  b.addEventListener('click', celebrate); // tests snowman + fireworks + parka unlock
  document.body.appendChild(b);
})();
*/

function celebrate() {
  buildSnowman();
  if (window.launchFireworks) window.launchFireworks();
  if (window.startAurora) window.startAurora(); // northern lights roll in
  showBubble('we built a snowman!!', 3000);
  addParka(); // first clear ever: he bundles up
  trackEvent('hunt-complete');
}
// ---------------------

// ========================================
// MII CHARACTER (replaces the old blue square)
// Rendered by Nintendo's Mii Studio API - full-body transparent PNGs
// ========================================

const P_W = 60;  // collision box width
const P_H = 84;  // collision box height
const RUN_THRESHOLD = 4; // faster than this on the ground = running animation
const SNOW_GROUND = 34;  // how high the snowy ground rises - the Mii walks on top of it

const MII_DATA = '000f165d656c6f72777c777b7a838e8f94a5acb3bac1ced5e4e7eeebeaf1d78e9198a1bcc6dcdfcfc9d4dbd8e3e9e7';
const miiUrl = (expr) =>
  `https://studio.mii.nintendo.com/miis/image.png?data=${MII_DATA}&type=all_body&width=270&bgColor=FFFFFF00&expression=${expr}`;

// Preload expressions so swaps are instant
['normal', 'surprise', 'smile_open_mouth'].forEach(e => {
  const img = new Image();
  img.src = miiUrl(e);
});

let miiImg = null;
let currentExpr = 'normal';
let pokeUntil = 0;

// Drag / pick-up state
let dragging = false;
let dragOffX = 0, dragOffY = 0;
let dragSamples = [];
let dragStartX = 0, dragStartY = 0;

// Wander AI state
let lastInputTime = 0;
let wanderDir = 1;
let wanderUntil = 0;
const WANDER_SPEED = 2.2;
const IDLE_BEFORE_WANDER = 3500; // ms after last keypress before he wanders off

function setExpression(expr) {
  if (miiImg && currentExpr !== expr) {
    currentExpr = expr;
    miiImg.src = miiUrl(expr);
  }
}

// ---- Speech bubble: the Mii occasionally comments on the page ----
let bubble = null;
let bubbleTimer = null;

const MII_QUIPS = {
  general: [
    'wow this is cool!',
    "it's snowing!",
    'look at the moon!',
    'you can pick me up!',
    'try the coin hunt!',
    'brr... chilly out here',
    'nice website huh?'
  ],
  home: [
    "that's my creator!",
    "hi, i'm lil anthony!",
    'he graduates june 2026!'
  ],
  experience: [
    "he's been busy!",
    'real production apps!',
    '15+ restaurant clients!'
  ],
  projects: [
    'check out these projects!',
    'pocketzot won an award!',
    'hackathon winner!'
  ],
  skills: [
    'so many skills!',
    'full-stack, baby!',
    'he even knows me... a Mii!'
  ],
  contact: [
    'say hello!',
    'his inbox is open!',
    'hire this guy!'
  ]
};

function miiSection() {
  let cur = 'home';
  document.querySelectorAll('section[id]').forEach(s => {
    if (window.scrollY >= s.offsetTop - 300) cur = s.getAttribute('id');
  });
  return cur;
}

function showBubble(text, ms = 3200) {
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add('show');
  clearTimeout(bubble._hide);
  bubble._hide = setTimeout(() => bubble.classList.remove('show'), ms);
}

// ---- Parka: unlocked the first time the snowflake hunt is cleared ----
function addParka() {
  if (!player || player.dataset.parka) return;
  player.dataset.parka = '1';

  const scaleBox = player.querySelector('.mii-scale');
  if (!scaleBox) return;

  const coat = document.createElement('div');
  coat.className = 'parka-body';
  scaleBox.appendChild(coat); // after the body img, so it covers the shirt

  const collar = document.createElement('div');
  collar.className = 'parka-collar';
  scaleBox.appendChild(collar);

  const hood = document.createElement('div');
  hood.className = 'parka-hood';
  scaleBox.appendChild(hood);

  // sleeves live inside the arm crops so they rotate with the arms
  player.querySelectorAll('.mii-arm').forEach(arm => {
    const sleeve = document.createElement('div');
    sleeve.className = 'parka-sleeve';
    arm.appendChild(sleeve);
  });

  setTimeout(() => showBubble('ooh, a parka! so warm ❄'), 3400);
}

function scheduleBubble() {
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    if (!dragging) {
      let pool = MII_QUIPS.general.concat(MII_QUIPS[miiSection()] || []);
      if (typeof huntActive !== 'undefined' && huntActive) {
        pool = pool.concat(['snowflakes!!', 'catch the flakes!', 'let it snow!']);
      }
      showBubble(pool[Math.floor(Math.random() * pool.length)]);
    }
    scheduleBubble();
  }, 9000 + Math.random() * 10000);
}

function spawnMii() {
  player = document.createElement('div');
  player.className = 'player';

  /* OLD blue square lil guy:
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
  */

  // Build the rig: one real Mii render, dissected into body + arms + legs.
  // Each limb is an overflow-hidden window onto its own copy of the render,
  // so the limbs are Nintendo's actual pixels but can rotate independently.
  const rig = document.createElement('div');
  rig.className = 'mii-rig';

  const scaleBox = document.createElement('div');
  scaleBox.className = 'mii-scale';

  const mkImg = () => {
    const im = document.createElement('img');
    im.alt = '';
    im.draggable = false;
    im.src = miiUrl('normal');
    return im;
  };

  miiImg = mkImg(); // body + face - expression swaps happen on this one
  miiImg.className = 'mii-body';
  // If Nintendo's API is unreachable, fall back to the classic blue square
  miiImg.onerror = () => {
    rig.remove();
    Object.assign(player.style, {
      width: '32px', height: '32px',
      backgroundColor: '#00bfff', borderRadius: '4px',
      boxShadow: '0 0 15px rgba(0, 191, 255, 0.6)', border: '2px solid white'
    });
  };
  // Limbs first so the body (head + torso) draws over the joint seams
  ['mii-arm arm-l', 'mii-arm arm-r', 'mii-leg leg-l', 'mii-leg leg-r']
    .forEach(cls => {
      const part = document.createElement('div');
      part.className = cls;
      part.appendChild(mkImg());
      scaleBox.appendChild(part);
    });

  scaleBox.appendChild(miiImg);

  rig.appendChild(scaleBox);
  player.appendChild(rig);

  bubble = document.createElement('div');
  bubble.className = 'mii-bubble';
  player.appendChild(bubble);
  setTimeout(() => showBubble("hi! i'm lil anthony!"), 2500);
  scheduleBubble();

  document.body.appendChild(player);

  playerX = window.innerWidth / 2 - P_W / 2;
  playerY = -80; // drop in from the top
  velocityX = 0;
  velocityY = 0;

  // --- Pick him up! ---
  player.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    player.setPointerCapture(e.pointerId);
    dragging = true;
    player.classList.add('held');
    player.classList.remove('walking', 'running', 'airborne');
    dragOffX = e.clientX - playerX;
    dragOffY = e.clientY - playerY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragSamples = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    setExpression('surprise');
    const yelp = ['waaah!!', 'hey, put me down!', 'whee!'];
    showBubble(yelp[Math.floor(Math.random() * yelp.length)], 1500);
    trackEvent('mii-grabbed', true);
  });

  player.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    playerX = e.clientX - dragOffX;
    playerY = e.clientY - dragOffY;
    dragSamples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (dragSamples.length > 6) dragSamples.shift();
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    player.classList.remove('held');

    const moved = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (moved < 6) {
      // Just a poke - little hop and a laugh
      velocityY = -8;
      pokeUntil = performance.now() + 900;
      setExpression('smile_open_mouth');
      showBubble('hehe!', 1000);
    } else {
      // Throw him with the drag momentum
      const a = dragSamples[0];
      const b = dragSamples[dragSamples.length - 1];
      const dt = Math.max(b.t - a.t, 16);
      velocityX = Math.max(-22, Math.min(22, (b.x - a.x) / dt * 18));
      velocityY = Math.max(-22, Math.min(22, (b.y - a.y) / dt * 18));
    }
    lastInputTime = performance.now(); // give him a moment before wandering again
  };
  player.addEventListener('pointerup', release);
  player.addEventListener('pointercancel', release);

  runGameLoop();
}

// The Mii lives on the page from the start (fun mode only)
if (FUN) window.addEventListener('load', spawnMii);

// ========================================
// COIN HUNT TOGGLE (the button now controls the game, not the Mii)
// ========================================

const spawnBtn = document.getElementById('spawn-character');
let huntActive = false;

// The whole hunt + keyboard control only exists in fun mode. In pro mode we
// must NOT attach the keydown handler, or it would swallow arrow/space page scroll.
if (FUN && spawnBtn) {
  spawnBtn.addEventListener('click', () => {
    if (huntActive) {
      huntActive = false;
      removeCoins();
      window.snowBoost = false; // calm the blizzard
      spawnBtn.textContent = 'Snowflake hunt ❄';
      return;
    }

    huntActive = true;
    coinScore = 0;
    celebrating = false;
    spawnCoins();
    createCoinDisplay();
    window.snowBoost = true; // hunt weather: blizzard!
    spawnBtn.textContent = 'End the hunt';
    trackEvent('hunt-start', true);
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if ((e.key === 'ArrowUp' || e.key === ' ' || e.key.toLowerCase() === 'w') && jumpCount < MAX_JUMPS && !dragging) {
      velocityY = -JUMP_FORCE;
      isOnGround = false;
      jumpCount++;
      lastInputTime = performance.now();
    }
    keys[e.key] = true;
  });

  window.addEventListener('keyup', (e) => keys[e.key] = false);
}

function runGameLoop() {
  if (!player) return;

  // While held, physics pauses - he just hangs from the cursor
  if (dragging) {
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    gameLoop = requestAnimationFrame(runGameLoop);
    return;
  }

  const now = performance.now();

  // Horizontal Movement (keyboard takes priority)
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    velocityX = -MOVE_SPEED;
    lastInputTime = now;
  } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    velocityX = MOVE_SPEED;
    lastInputTime = now;
  } else if (!isOnGround) {
    // Airborne: keep horizontal momentum (tiny air drag) so throws
    // follow a real parabolic arc instead of dropping straight down
    velocityX *= 0.995;
  } else if (now - lastInputTime > IDLE_BEFORE_WANDER) {
    // Wander AI: stroll around, pause, occasionally hop
    if (now > wanderUntil) {
      const roll = Math.random();
      if (roll < 0.35) {
        wanderDir = 0; // take a break
        wanderUntil = now + 800 + Math.random() * 2000;
      } else {
        wanderDir = roll < 0.675 ? -1 : 1;
        wanderUntil = now + 1000 + Math.random() * 2500;
        if (isOnGround && Math.random() < 0.15) velocityY = -7; // playful hop
      }
    }
    // Turn around at the screen edges
    if (playerX < 10) wanderDir = 1;
    if (playerX > window.innerWidth - P_W - 10) wanderDir = -1;

    if (wanderDir !== 0) velocityX = wanderDir * WANDER_SPEED;
    else velocityX *= FRICTION;
  } else {
    velocityX *= FRICTION;
  }

  velocityY += GRAVITY;
  playerX += velocityX;
  playerY += velocityY;

  // Screen wrap (horizontal only - the floor catches him below)
  if (playerX < -P_W - 20) playerX = window.innerWidth;
  if (playerX > window.innerWidth + 20) playerX = -P_W;

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

      // Ensure the box isn't a giant empty section (Safety check)
      if (rect.width > 0 && rect.height > 0 && rect.height < window.innerHeight * 0.9) {
        if (playerX + P_W > rect.left && playerX < rect.right) {
          if (
            velocityY > 0 &&
            playerY + P_H >= rect.top &&
            playerY + P_H <= rect.top + velocityY + 10
          ) {
            playerY = rect.top - P_H;
            velocityY = 0;
            groundedThisFrame = true;
          }
        }
      }
    });
  }

  // Floor on the snowy ground - he never falls off screen
  if (playerY + P_H >= window.innerHeight - SNOW_GROUND) {
    playerY = window.innerHeight - SNOW_GROUND - P_H;
    if (velocityY > 0) velocityY = 0;
    groundedThisFrame = true;
  }

  if (groundedThisFrame) {
    isOnGround = true;
    jumpCount = 0;
  } else {
    isOnGround = false;
  }

  // Facing + walk/run/airborne animation states
  if (velocityX < -0.5) player.classList.add('facing-left');
  else if (velocityX > 0.5) player.classList.remove('facing-left');
  const speed = Math.abs(velocityX);
  const running = isOnGround && speed > RUN_THRESHOLD;
  player.classList.toggle('running', running);
  player.classList.toggle('walking', isOnGround && speed > 0.5 && !running);
  player.classList.toggle('airborne', !isOnGround);

  // Expression: surprised mid-air, laughing after a poke, chill otherwise
  const t = performance.now();
  if (!isOnGround && Math.abs(velocityY) > 3) setExpression('surprise');
  else if (t < pokeUntil) setExpression('smile_open_mouth');
  else setExpression('normal');

  player.style.left = playerX + 'px';
  player.style.top = playerY + 'px';

  checkCoinCollisions();

  gameLoop = requestAnimationFrame(runGameLoop);
}

// ========================================
// PIXEL SNOW - retro chunky snowflakes drifting behind the whole page
// ========================================

(function initPixelSnow() {
  if (!FUN) return; // snow, moon, clouds, hills, cabin, aurora, fireworks
  const canvas = document.createElement('canvas');
  canvas.id = 'pixel-snow';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // move the wooden sign after the canvas in the DOM so the snow scene
  // paints BEHIND it (both are z-index -1, so DOM order decides)
  const sign = document.getElementById('mii-sign');
  if (sign) document.body.appendChild(sign);

  let flakes = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: (1 + Math.floor(Math.random() * 3)) * 2,   // 2, 4, or 6px squares
      speed: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      sway: 0.2 + Math.random() * 0.4,
      alpha: 0.25 + Math.random() * 0.5,
      cyan: Math.random() < 0.18                        // a few accent-colored flakes
    }));
  }

  // Snowy landscape: pixelated rolling hills prerendered at the bottom
  const ground = document.createElement('canvas');
  let cabin = null;   // chimney position, set while drawing the ground
  const smoke = [];   // rising smoke puffs
  let lastPuff = 0;

  // Little pixel cabin with a warm window; s scales it down for distance
  function drawCabin(g, cx, baseY, s = 1) {
    const W = Math.round(56 * s);
    const H = Math.round(30 * s);

    // body + door
    g.fillStyle = 'rgba(40, 52, 78, 0.6)';
    g.fillRect(cx - W / 2, baseY - H, W, H);
    g.fillStyle = 'rgba(25, 33, 52, 0.7)';
    g.fillRect(cx + 8 * s, baseY - 16 * s, Math.max(3, 10 * s), 16 * s);

    // warm glow spilling from the window
    const wx = cx - 16 * s;
    const wy = baseY - 19 * s;
    const wSize = Math.max(4, Math.round(9 * s));
    const halo = g.createRadialGradient(wx + wSize / 2, wy + wSize / 2, 2, wx + wSize / 2, wy + wSize / 2, 22 * s);
    halo.addColorStop(0, 'rgba(255, 190, 100, 0.28)');
    halo.addColorStop(1, 'rgba(255, 190, 100, 0)');
    g.fillStyle = halo;
    g.fillRect(wx - 18 * s, wy - 18 * s, 44 * s, 44 * s);

    // window with cross panes
    g.fillStyle = 'rgba(255, 205, 120, 0.9)';
    g.fillRect(wx, wy, wSize, wSize);
    g.fillStyle = 'rgba(40, 52, 78, 0.9)';
    g.fillRect(wx + wSize / 2, wy, 1, wSize);
    g.fillRect(wx, wy + wSize / 2, wSize, 1);

    // stepped roof with a dusting of snow
    const rowH = Math.max(2, Math.round(4 * s));
    for (let r = 0; r < 5; r++) {
      const rowW = W + 8 * s - r * 14 * s;
      const y = baseY - H - rowH * (r + 1);
      g.fillStyle = 'rgba(60, 74, 104, 0.65)';
      g.fillRect(cx - rowW / 2, y, rowW, rowH);
      g.fillStyle = 'rgba(215, 232, 252, 0.4)';
      g.fillRect(cx - rowW / 2, y, rowW, Math.max(1, rowH / 2));
    }

    // chimney poking through the roof
    g.fillStyle = 'rgba(45, 55, 80, 0.7)';
    g.fillRect(cx + 9 * s, baseY - H - 30 * s, Math.max(3, 7 * s), 16 * s);
    g.fillStyle = 'rgba(215, 232, 252, 0.5)';
    g.fillRect(cx + 9 * s, baseY - H - 30 * s, Math.max(3, 7 * s), Math.max(1, 2 * s));

    cabin = { chimneyX: cx + 12 * s, chimneyY: baseY - H - 32 * s, s };
  }

  // Slow smoke trail drifting up from the chimney
  function drawSmoke(now) {
    if (!cabin) return;
    if (now - lastPuff > 1100) {
      lastPuff = now;
      smoke.push({ x: cabin.chimneyX, y: cabin.chimneyY, t0: now, phase: Math.random() * Math.PI * 2 });
    }
    const cs = cabin.s || 1; // shrink the smoke with the distant cabin
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      const p = (now - s.t0) / 6000;
      if (p >= 1) { smoke.splice(i, 1); continue; }
      const x = s.x + Math.sin(p * 5 + s.phase) * 6 * cs + p * 12 * cs; // wafts right with the wind
      const y = s.y - p * 70 * cs;
      const size = Math.max(2, Math.floor((3 + p * 5) * cs));
      ctx.fillStyle = `rgba(205, 220, 240, ${0.14 * (1 - p)})`;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }
  }

  // Pixel pine tree: three stacked canopy tiers + a stubby trunk
  function drawTree(g, cx, baseY, size, color) {
    g.fillStyle = color;
    const trunkH = Math.max(3, Math.round(size * 0.12));
    const canopyH = size - trunkH;
    const tiers = 3;
    const tierH = canopyH / tiers;
    for (let tier = 0; tier < tiers; tier++) {
      const topY = baseY - size + tier * tierH;
      const maxHW = ((tier + 1) / tiers) * size * 0.32; // tier widens toward its base
      for (let r = 0; r < tierH; r += 2) {
        const hw = Math.max(2, Math.round(((r + 2) / tierH) * maxHW / 2) * 2);
        g.fillRect(Math.round(cx - hw), Math.round(topY + r), hw * 2, 2);
      }
    }
    g.fillRect(Math.round(cx - 1), Math.round(baseY - trunkH), 3, trunkH);
  }

  function drawGround() {
    ground.width = canvas.width;
    ground.height = canvas.height;
    const g = ground.getContext('2d');
    const layers = [
      { base: 92, amp: 26, color: 'rgba(140, 170, 210, 0.10)',   // far hills
        trees: { every: 340, size: [14, 22], color: 'rgba(150, 180, 215, 0.13)' },
        cabin: true },
      { base: 64, amp: 16, color: 'rgba(180, 205, 240, 0.16)',   // mid hills
        trees: { every: 280, size: [22, 34], color: 'rgba(185, 210, 240, 0.20)' } },
      { base: 44, amp: 8,  color: 'rgba(222, 236, 255, 0.45)' }  // front snowbank
    ];
    const STEP = 10;  // pixel column width
    const QUANT = 6;  // height quantization for the chunky look

    layers.forEach(L => {
      const p1 = Math.random() * Math.PI * 2;
      const p2 = Math.random() * Math.PI * 2;
      const heightAt = (x) => {
        const h = L.base
          + Math.sin(x * 0.004 + p1) * L.amp
          + Math.sin(x * 0.011 + p2) * L.amp * 0.5;
        return Math.max(10, Math.round(h / QUANT) * QUANT);
      };

      g.fillStyle = L.color;
      for (let x = 0; x < ground.width; x += STEP) {
        const h = heightAt(x);
        g.fillRect(x, ground.height - h, STEP, h);
      }

      // scatter winter trees along this layer's ridgeline
      if (L.trees) {
        const count = Math.max(2, Math.floor(ground.width / L.trees.every));
        for (let i = 0; i < count; i++) {
          const x = Math.round((ground.width / count) * (i + 0.2 + Math.random() * 0.6) / 2) * 2;
          const size = L.trees.size[0] + Math.random() * (L.trees.size[1] - L.trees.size[0]);
          drawTree(g, x, ground.height - heightAt(x) + 4, Math.round(size), L.trees.color);
        }
      }

      // the cabin sits far away on the back hills, sunk into the snow.
      // Use the LOWEST ridge point under its whole footprint so no corner
      // floats when the hill curves or slopes under it.
      if (L.cabin) {
        const s = 0.6; // distance scale
        const cx = Math.round(ground.width * 0.2);
        const half = Math.round(28 * s);
        let surfaceY = 0;
        for (let x = cx - half; x <= cx + half; x += 6) {
          surfaceY = Math.max(surfaceY, ground.height - heightAt(x));
        }
        drawCabin(g, cx, surfaceY + Math.round(10 * s), s);
      }
    });
  }

  // Rolling pixel clouds: each is prerendered once, then drifts across slowly
  function makeCloud() {
    // long, thin streaks rather than puffy blobs
    const w = 240 + Math.random() * 220;
    const h = 16 + Math.random() * 14;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = 'rgb(195, 218, 245)';
    const B = 6; // pixel block size
    const lobes = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < lobes; i++) {
      const cx = w * (0.1 + 0.8 * Math.random());
      const cy = h * 0.55 + (Math.random() - 0.5) * h * 0.2;
      const r = h * (0.5 + Math.random() * 0.4);
      for (let x = 0; x < w; x += B) {
        for (let y = 0; y < h; y += B) {
          // squash the distance horizontally so each lobe is a stretched oval
          if (Math.hypot((x + B / 2 - cx) / 3.2, y + B / 2 - cy) < r) g.fillRect(x, y, B, B);
        }
      }
    }
    return {
      img: c,
      x: Math.random() * window.innerWidth,
      y: 30 + Math.random() * (window.innerHeight * 0.35),
      speed: 0.08 + Math.random() * 0.15,
      alpha: 0.04 + Math.random() * 0.05
    };
  }

  const clouds = Array.from({ length: 5 }, makeCloud);

  function drawClouds() {
    clouds.forEach(cl => {
      cl.x += cl.speed;
      if (cl.x > canvas.width + 20) {
        cl.x = -cl.img.width - 20;
        cl.y = 30 + Math.random() * (canvas.height * 0.35);
      }
      ctx.globalAlpha = cl.alpha;
      ctx.drawImage(cl.img, Math.floor(cl.x), Math.floor(cl.y));
      ctx.globalAlpha = 1;
    });
  }

  // Aurora borealis - shimmers across the sky after clearing the hunt
  let auroraStart = -1;
  const AURORA_MS = 26000;
  window.startAurora = () => { auroraStart = performance.now(); };

  function drawAurora(now) {
    if (auroraStart < 0) return;
    const t = now - auroraStart;
    if (t > AURORA_MS) { auroraStart = -1; return; }
    // fade in over 2.5s, fade out over the last 4s
    const env = Math.min(t / 2500, 1, (AURORA_MS - t) / 4000);
    const ts = now * 0.0004;
    for (let x = 0; x < canvas.width; x += 8) {
      const base = 230 + Math.sin(x * 0.004 + ts * 2) * 34 + Math.sin(x * 0.011 - ts * 3) * 14;
      const K = 9 + Math.round(Math.sin(x * 0.02 + ts * 4) * 3); // curtain height ripples
      for (let k = 0; k < K; k++) {
        const a = env * 0.3 * Math.pow(1 - k / K, 1.6); // brightest at the lower edge
        ctx.fillStyle = k < 3
          ? `rgba(110, 255, 180, ${a})`
          : k < 6
            ? `rgba(110, 220, 255, ${a * 0.8})`
            : `rgba(170, 140, 255, ${a * 0.6})`;
        ctx.fillRect(x, Math.floor(base - k * 7), 8, 7);
      }
    }
  }

  // Pixel fireworks over the hills - launched when the snowflake hunt is cleared
  const fireworks = [];
  const FW_COLORS = ['#9fdcff', '#ffd28a', '#ffffff', '#ff9fb2', '#00bfff'];

  window.launchFireworks = function () {
    const now = performance.now();
    for (let i = 0; i < 5; i++) {
      fireworks.push({
        type: 'rocket',
        x: canvas.width * (0.15 + Math.random() * 0.7),
        y: canvas.height - 70,
        burstY: canvas.height * (0.18 + Math.random() * 0.25),
        t0: now + i * 420 + Math.random() * 200,
        color: FW_COLORS[i % FW_COLORS.length]
      });
    }
  };

  function drawFireworks(now) {
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const f = fireworks[i];
      if (f.type === 'rocket') {
        if (now < f.t0) continue;
        f.y -= 7;
        ctx.fillStyle = 'rgba(255, 240, 210, 0.8)';
        ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 2, 5);
        if (f.y <= f.burstY) {
          // pop! replace the rocket with a ring of sparks
          fireworks.splice(i, 1);
          const count = 26 + Math.floor(Math.random() * 10);
          for (let k = 0; k < count; k++) {
            const ang = (Math.PI * 2 * k) / count + Math.random() * 0.2;
            const speed = 1.2 + Math.random() * 2.1;
            fireworks.push({
              type: 'spark',
              x: f.x, y: f.y,
              vx: Math.cos(ang) * speed,
              vy: Math.sin(ang) * speed,
              t0: now,
              life: 900 + Math.random() * 500,
              color: f.color
            });
          }
        }
      } else {
        const p = (now - f.t0) / f.life;
        if (p >= 1) { fireworks.splice(i, 1); continue; }
        f.vy += 0.03; // sparks fall as they fade
        f.x += f.vx;
        f.y += f.vy;
        // twinkle: older sparks flicker
        if (p > 0.55 && Math.floor(now / 60) % 3 === 0) continue;
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = f.color;
        ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Pixel moon that cycles through its phases (new → waxing → full → waning)
  function drawMoon(now) {
    const phase = (now / 45000) % 1; // full lunar cycle every 45 seconds
    const cx = Math.floor(canvas.width * 0.85);
    const cy = 120;
    const R = 27;
    const B = 3; // pixel block size
    const c = Math.cos(2 * Math.PI * phase);

    // soft halo
    const glow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.4);
    glow.addColorStop(0, 'rgba(200, 225, 255, 0.06)');
    glow.addColorStop(1, 'rgba(200, 225, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - R * 2.4, cy - R * 2.4, R * 4.8, R * 4.8);

    for (let py = -R; py < R; py += B) {
      const w = Math.sqrt(Math.max(R * R - py * py, 0)); // disc half-width at this row
      for (let px = -R; px < R; px += B) {
        if (px * px + py * py > R * R) continue;
        // waxing lights up from the right, waning fades out to the left
        const lit = phase < 0.5 ? px > w * c : px < -w * c;
        ctx.fillStyle = lit ? 'rgba(226, 238, 255, 0.55)' : 'rgba(170, 195, 230, 0.07)';
        ctx.fillRect(cx + px, cy + py, B, B);
      }
    }
  }

  let t = 0;
  function draw() {
    t += 0.01;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMoon(performance.now());
    drawAurora(performance.now());
    drawClouds(); // clouds drift in front of the moon and aurora
    const boost = window.snowBoost ? 2.6 : 1; // blizzard during the snowflake hunt
    flakes.forEach(f => {
      f.y += f.speed * boost;
      f.x += Math.sin(t * 2 + f.phase) * f.sway * boost;
      if (f.y > canvas.height + 6) { f.y = -6; f.x = Math.random() * canvas.width; }
      if (f.x > canvas.width + 6) f.x = -6;
      if (f.x < -6) f.x = canvas.width + 6;
      ctx.fillStyle = f.cyan
        ? `rgba(0, 191, 255, ${f.alpha * 0.8})`
        : `rgba(230, 241, 255, ${f.alpha})`;
      // integer coords keep the squares crisp and pixelated
      ctx.fillRect(Math.floor(f.x), Math.floor(f.y), f.size, f.size);
    });
    ctx.drawImage(ground, 0, 0); // falling flakes vanish into the snowbank
    drawSmoke(performance.now());
    drawFireworks(performance.now());
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); drawGround(); });
  resize();
  drawGround();
  draw();
})();

// ========================================
// TEXT TYPE - typewriter effect on the hero tagline
// ========================================

(function initTextType() {
  if (!FUN) return; // pro keeps the static professional tagline from the HTML
  const el = document.querySelector('.hero-tagline');
  if (!el) return;

  const phrases = [
    'I loveee building and creating.',
    'I loveee to explore and learn.',
    'I loveee meeting new people.'
  ];

  el.textContent = '';
  const textNode = document.createTextNode('');
  el.appendChild(textNode);
  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  cursor.textContent = '|';
  el.appendChild(cursor);

  let p = 0;
  let i = 0;
  let deleting = false;

  function tick() {
    const phrase = phrases[p];
    if (!deleting) {
      i++;
      textNode.textContent = phrase.slice(0, i);
      if (i === phrase.length) {
        deleting = true;
        setTimeout(tick, 2600); // hold the finished phrase
        return;
      }
      setTimeout(tick, 45 + Math.random() * 45);
    } else {
      i--;
      textNode.textContent = phrase.slice(0, i);
      if (i === 0) {
        deleting = false;
        p = (p + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 25);
    }
  }

  // start after the hero fade-in finishes
  setTimeout(tick, 1300);
})();

// ========================================
// DOT GRID - inside each experience card, dots light up near the cursor
// ========================================

(function initDotGrid() {
  if (!FUN) return; // pro mode: clean cards, no reactive dot grid
  const cards = Array.from(document.querySelectorAll('.experience-item, .project-card'));
  if (!cards.length) return;

  const SPACING = 26;
  const RADIUS = 1.5;
  const INFLUENCE = 130;

  let clientX = -9999;
  let clientY = -9999;

  window.addEventListener('mousemove', (e) => {
    clientX = e.clientX;
    clientY = e.clientY;
  });

  const grids = cards.map(card => {
    const canvas = document.createElement('canvas');
    canvas.className = 'dot-grid-canvas';
    card.prepend(canvas);
    return { card, canvas, ctx: canvas.getContext('2d'), smX: -9999, smY: -9999 };
  });

  function resize() {
    grids.forEach(g => {
      g.canvas.width = g.card.clientWidth;
      g.canvas.height = g.card.clientHeight;
    });
  }

  function draw() {
    grids.forEach(g => {
      const rect = g.card.getBoundingClientRect();
      // skip cards that are off screen
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      g.smX += (mx - g.smX) * 0.18;
      g.smY += (my - g.smY) * 0.18;

      const { ctx, canvas } = g;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let x = SPACING / 2; x < canvas.width; x += SPACING) {
        for (let y = SPACING / 2; y < canvas.height; y += SPACING) {
          const d = Math.hypot(x - g.smX, y - g.smY);
          let r = RADIUS;
          if (d < INFLUENCE) {
            const f = 1 - d / INFLUENCE;
            r = RADIUS + 2 * f;
            ctx.fillStyle = `rgba(0, 191, 255, ${0.12 + 0.5 * f})`;
          } else {
            ctx.fillStyle = 'rgba(136, 146, 176, 0.12)';
          }
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ========================================
// LOGO LOOP - duplicate the logo set so the marquee loops seamlessly
// ========================================

(function initLogoLoop() {
  const track = document.querySelector('.logo-track');
  if (!track) return;
  const set = track.querySelector('.logo-set');
  const clone = set.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
})();

// ========================================
// CURSOR FX - pixel wind trail behind the mouse + click sparks
// ========================================

(function initCursorFX() {
  if (!FUN) return; // pro mode: no pixel wind trail or click sparks
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-fx';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const dust = [];   // wind trail pixels
  const sparks = []; // click bursts
  let running = false;

  function ensureLoop() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  // --- wind trail: pixels stream off the cursor and get carried away ---
  let lastX = null;
  let lastY = null;

  window.addEventListener('mousemove', (e) => {
    const dx = lastX === null ? 0 : e.clientX - lastX;
    const dy = lastY === null ? 0 : e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) < 2) return; // only when actually moving

    const n = Math.min(3, 1 + Math.floor((Math.abs(dx) + Math.abs(dy)) / 14));
    for (let i = 0; i < n; i++) {
      dust.push({
        x: e.clientX + (Math.random() - 0.5) * 8,
        y: e.clientY + (Math.random() - 0.5) * 8,
        vx: -dx * (0.06 + Math.random() * 0.08) + (Math.random() - 0.5) * 0.6,
        vy: -dy * (0.06 + Math.random() * 0.08) - 0.15 + (Math.random() - 0.5) * 0.5,
        size: 2 + Math.floor(Math.random() * 2) * 2, // 2 or 4 px
        t0: performance.now(),
        life: 500 + Math.random() * 450,
        phase: Math.random() * Math.PI * 2,
        cyan: Math.random() < 0.25
      });
    }
    if (dust.length > 220) dust.splice(0, dust.length - 220);
    ensureLoop();
  });

  // --- click spark ---
  const SPARK_MS = 420;
  const SPARK_COUNT = 8;
  window.addEventListener('pointerdown', (e) => {
    sparks.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    ensureLoop();
  });

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // wind pixels: drift away from the cursor path with a breezy sway
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i];
      const p = (now - d.t0) / d.life;
      if (p >= 1) { dust.splice(i, 1); continue; }
      d.x += d.vx + Math.sin(now * 0.004 + d.phase) * 0.4;
      d.y += d.vy;
      d.vx *= 0.97;
      d.vy *= 0.97;
      const a = (1 - p) * 0.65;
      ctx.fillStyle = d.cyan
        ? `rgba(0, 191, 255, ${a})`
        : `rgba(226, 238, 255, ${a})`;
      ctx.fillRect(Math.floor(d.x), Math.floor(d.y), d.size, d.size);
    }

    // click sparks: short lines shooting outward
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const p = (now - s.t0) / SPARK_MS;
      if (p >= 1) { sparks.splice(i, 1); continue; }
      const eased = 1 - Math.pow(1 - p, 3);
      ctx.strokeStyle = `rgba(0, 191, 255, ${1 - p})`;
      ctx.lineWidth = 2;
      for (let k = 0; k < SPARK_COUNT; k++) {
        const ang = (Math.PI * 2 * k) / SPARK_COUNT;
        const r0 = eased * 20;
        const r1 = r0 + 11 * (1 - eased);
        ctx.beginPath();
        ctx.moveTo(s.x + Math.cos(ang) * r0, s.y + Math.sin(ang) * r0);
        ctx.lineTo(s.x + Math.cos(ang) * r1, s.y + Math.sin(ang) * r1);
        ctx.stroke();
      }
    }

    if (dust.length || sparks.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
})();