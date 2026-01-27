// Smart Scroll UI - Hide unnecessary info when scrolling
class SmartScrollUI {
  constructor() {
    this.lastScrollY = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.init();
  }

  init() {
    this.setupScrollListener();
    this.setupScrollClasses();
    this.setupDynamicContent();
  }

  setupScrollListener() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  handleScroll() {
    const currentScrollY = window.scrollY;
    const scrollDirection = currentScrollY > this.lastScrollY ? 'down' : 'up';
    const scrollVelocity = Math.abs(currentScrollY - this.lastScrollY);
    
    // Determine scroll state
    this.updateScrollState(currentScrollY, scrollDirection, scrollVelocity);
    
    // Hide/show elements based on scroll
    this.toggleElements(currentScrollY, scrollDirection);
    
    // Update header behavior
    this.updateHeader(currentScrollY, scrollDirection);
    
    this.lastScrollY = currentScrollY;
    
    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    // Set new timeout for scroll end
    this.scrollTimeout = setTimeout(() => {
      this.onScrollEnd();
    }, 150);
  }

  updateScrollState(scrollY, direction, velocity) {
    const body = document.body;
    
    // Remove all scroll state classes
    body.classList.remove('scrolling-up', 'scrolling-down', 'scrolling-fast', 'at-top', 'scrolled');
    
    // Add appropriate classes
    if (scrollY === 0) {
      body.classList.add('at-top');
    } else {
      body.classList.add('scrolled');
      
      if (velocity > 10) {
        body.classList.add('scrolling-fast');
      }
      
      if (direction === 'down') {
        body.classList.add('scrolling-down');
      } else {
        body.classList.add('scrolling-up');
      }
    }
  }

  toggleElements(scrollY, direction) {
    // Elements to hide when scrolling down
    const hideOnDownScroll = document.querySelectorAll('.hide-on-scroll');
    // Elements to hide when scrolling fast
    const hideOnFastScroll = document.querySelectorAll('.hide-on-fast-scroll');
    // Elements to always show minimal version
    const minimalElements = document.querySelectorAll('.minimal-on-scroll');
    
    if (direction === 'down' && scrollY > 100) {
      // Hide non-essential elements when scrolling down
      hideOnDownScroll.forEach(el => {
        el.style.transform = 'translateY(-100%)';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      });
      
      // Show minimal versions
      minimalElements.forEach(el => {
        el.classList.add('minimal');
      });
    } else {
      // Show all elements when scrolling up or at top
      hideOnDownScroll.forEach(el => {
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      });
      
      // Remove minimal versions
      minimalElements.forEach(el => {
        el.classList.remove('minimal');
      });
    }
    
    // Hide elements on fast scroll
    if (document.body.classList.contains('scrolling-fast')) {
      hideOnFastScroll.forEach(el => {
        el.style.opacity = '0.3';
      });
    } else {
      hideOnFastScroll.forEach(el => {
        el.style.opacity = '1';
      });
    }
  }

  updateHeader(scrollY, direction) {
    const header = document.querySelector('.app-header, .mobile-header');
    if (!header) return;
    
    if (direction === 'down' && scrollY > 100) {
      // Hide header when scrolling down
      header.style.transform = 'translateY(-100%)';
    } else {
      // Show header when scrolling up or at top
      header.style.transform = 'translateY(0)';
    }
  }

  onScrollEnd() {
    // Actions when scrolling stops
    document.body.classList.remove('scrolling-fast');
    
    // Restore full opacity for all elements
    document.querySelectorAll('.hide-on-fast-scroll').forEach(el => {
      el.style.opacity = '1';
    });
  }

  setupScrollClasses() {
    const style = document.createElement('style');
    style.textContent = `
      /* Scroll-based visibility classes */
      .hide-on-scroll {
        transition: all 0.3s ease;
        transform-origin: top;
      }
      
      .hide-on-fast-scroll {
        transition: opacity 0.2s ease;
      }
      
      .minimal-on-scroll {
        transition: all 0.3s ease;
      }
      
      .minimal-on-scroll.minimal {
        transform: scale(0.8);
        opacity: 0.7;
      }
      
      /* Hide non-essential content when scrolling */
      body.scrolled .non-essential {
        opacity: 0.3;
        transform: scale(0.95);
      }
      
      body.scrolling-down .secondary-info {
        display: none;
      }
      
      body.scrolling-down .feature-description {
        opacity: 0;
        height: 0;
        overflow: hidden;
      }
      
      body.scrolling-down .stat-card {
        padding: 12px;
        margin-bottom: 8px;
      }
      
      body.scrolling-down .stat-label {
        font-size: 0.75rem;
      }
      
      body.scrolling-down .card-header {
        padding: 12px;
      }
      
      body.scrolling-down .card-body {
        padding: 12px;
      }
      
      /* Compact mode when scrolling */
      body.scrolled .compact-on-scroll {
        transform: scale(0.9);
        margin: 8px 0;
      }
      
      /* Hide decorative elements */
      body.scrolled .decorative,
      body.scrolled .marketing-content {
        display: none;
      }
      
      /* Focus on essential content */
      body.scrolled .essential-content {
        transform: scale(1.02);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      }
      
      /* Smooth transitions */
      * {
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      
      /* Reading mode - show only content */
      body.reading-mode .sidebar,
      body.reading-mode .header-nav,
      body.reading-mode .footer {
        opacity: 0.1;
        pointer-events: none;
      }
      
      body.reading-mode .main-content {
        max-width: 800px;
        margin: 0 auto;
      }
    `;
    document.head.appendChild(style);
  }

  setupDynamicContent() {
    // Add classes to existing elements
    this.markNonEssentialElements();
    this.setupReadingMode();
    this.setupQuickActions();
  }

  markNonEssentialElements() {
    // Mark elements that should be hidden when scrolling
    const nonEssential = [
      '.feature-card',
      '.cta-section',
      '.marketing-banner',
      '.social-links',
      '.footer-links',
      '.secondary-navigation'
    ];
    
    nonEssential.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('non-essential');
      });
    });
    
    // Mark essential elements
    const essential = [
      '.main-content',
      '.dashboard-grid',
      '.content-card',
      '.data-table',
      '.action-buttons'
    ];
    
    essential.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('essential-content');
      });
    });
  }

  setupReadingMode() {
    // Add reading mode toggle
    const readingModeBtn = document.createElement('button');
    readingModeBtn.innerHTML = '📖';
    readingModeBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      z-index: 10000;
      font-size: 1.2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;
    
    readingModeBtn.addEventListener('click', () => {
      document.body.classList.toggle('reading-mode');
      readingModeBtn.innerHTML = document.body.classList.contains('reading-mode') ? '🔙' : '📖';
    });
    
    document.body.appendChild(readingModeBtn);
  }

  setupQuickActions() {
    // Add quick action buttons that appear on scroll
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 9999;
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.3s ease;
    `;
    
    // Add scroll to top button
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '⬆️';
    scrollTopBtn.style.cssText = `
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      font-size: 1.2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    quickActions.appendChild(scrollTopBtn);
    document.body.appendChild(quickActions);
    
    // Show/hide quick actions based on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 200) {
        quickActions.style.opacity = '1';
        quickActions.style.transform = 'translateY(0)';
      } else {
        quickActions.style.opacity = '0';
        quickActions.style.transform = 'translateY(100px)';
      }
    });
  }
}

// Initialize Smart Scroll UI
document.addEventListener('DOMContentLoaded', () => {
  new SmartScrollUI();
});
