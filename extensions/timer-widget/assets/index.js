
// 🔧 Timer Widget - Vanilla JS
// Loads timer data from backend and displays countdown timer on product pages

// CSS will be loaded by the Liquid template

// 🔧 Timer Data Fetching - Simplified for localhost development
async function fetchTimerData() {
  const shopDomain = window.location.hostname;
  
  // Try localhost URLs (for local development)
  const localhostUrls = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  
  for (const localUrl of localhostUrls) {
    try {
      const response = await fetch(`${localUrl}/api/public/timers?shopDomain=${encodeURIComponent(shopDomain)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.timers) {
          return data;
        }
      }
    } catch (error) {
      // Continue to next URL if this one fails
      continue;
    }
  }

  throw new Error('Failed to fetch timer data from backend');
}

// 🔧 Vanilla JS Countdown Timer
class CountdownTimer {
  constructor(container, timer) {
    this.container = container;
    this.timer = timer;
    this.timeLeft = null;
    this.isExpired = false;
    this.interval = null;
    
    this.init();
  }
  
  init() {
    this.updateTimer();
    this.interval = setInterval(() => this.updateTimer(), 1000);
  }
  
  updateTimer() {
    const now = new Date();
    const endTime = new Date(this.timer.endDate);
    const timeDiff = endTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      this.isExpired = true;
      this.render();
      clearInterval(this.interval);
      return;
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    this.timeLeft = { days, hours, minutes, seconds };
    
    const urgencyThreshold = (this.timer.urgencySettings?.warningTimeMinutes || 5) * 60 * 1000;
    const isUrgent = timeDiff <= urgencyThreshold && timeDiff > 0;
    
    if (isUrgent) {
      document.body.classList.add('timer-urgent');
    } else {
      document.body.classList.remove('timer-urgent');
    }
    
    this.render();
  }

  render() {
    if (this.isExpired) {
      this.container.innerHTML = `
        <div class="timer-widget expired">
          <div class="timer-message">⏰ Timer Expired!</div>
        </div>
      `;
      return;
    }
    
    if (!this.timeLeft) {
      this.container.innerHTML = '<div class="timer-widget loading">Loading...</div>';
      return;
    }

    const displayOptions = this.timer.displayOptions || {};
    const urgencyThreshold = (this.timer.urgencySettings?.warningTimeMinutes || 5) * 60 * 1000;
    const now = new Date();
    const endTime = new Date(this.timer.endDate);
    const timeDiff = endTime.getTime() - now.getTime();
    const isUrgent = timeDiff <= urgencyThreshold && timeDiff > 0;
    
    let html = `
      <div class="timer-widget ${isUrgent ? 'urgent' : ''}" 
           style="--timer-color: ${displayOptions.color || '#ffc107'}; --timer-size: ${displayOptions.size || 'medium'}">
    `;
    
    if (isUrgent && this.timer.urgencySettings?.enableBanner) {
      html += `
        <div class="urgency-banner">
          🚨 Hurry! Only ${this.timeLeft.minutes}m ${this.timeLeft.seconds}s left!
        </div>
      `;
    }
    
    html += `
      <div class="timer-message">
        ${this.timer.description || 'Special offer ends in:'}
      </div>
    `;
    
    html += '<div class="timer-display">';
    
    if (this.timeLeft.days > 0) {
      html += `
        <div class="timer-unit">
          <span class="timer-number">${this.timeLeft.days}</span>
          <span class="timer-label">DAYS</span>
        </div>
      `;
    }
    
    html += `
      <div class="timer-unit">
        <span class="timer-number">${this.timeLeft.hours.toString().padStart(2, '0')}</span>
        <span class="timer-label">HOURS</span>
      </div>
      <div class="timer-unit">
        <span class="timer-number">${this.timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span class="timer-label">MINS</span>
      </div>
      <div class="timer-unit">
        <span class="timer-number">${this.timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span class="timer-label">SECS</span>
      </div>
    </div>
    </div>
    `;
    
    this.container.innerHTML = html;
  }
  
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// 🔧 Main Timer Widget Manager
class TimerWidgetManager {
  constructor(container) {
    this.container = container;
    this.timerInstance = null;
    
    this.init();
  }
  
  async init() {
    this.showLoading();
    
    try {
      const data = await fetchTimerData();
      
      if (data?.success && Array.isArray(data.timers) && data.timers.length > 0) {
        const now = new Date();
        const activeTimers = data.timers.filter(timer => {
          const startDate = new Date(timer.startDate);
          const endDate = new Date(timer.endDate);
          return now >= startDate && now <= endDate;
        });
        
        if (activeTimers.length > 0) {
          this.showTimer(activeTimers[0]);
          return;
        }
      }

      this.hideContainer();
    } catch (err) {
      console.error('Timer widget error:', err);
      this.hideContainer();
    }
  }
  
  showLoading() {
    this.container.innerHTML = '<div class="timer-widget loading">⏰ Loading countdown...</div>';
  }
  
  hideContainer() {
    this.container.innerHTML = '';
    this.container.style.display = 'none';
  }
  
  showTimer(timerData) {
    if (this.timerInstance) {
      this.timerInstance.destroy();
    }
    
    this.container.style.display = '';
    this.timerInstance = new CountdownTimer(this.container, timerData);
  }
  
  destroy() {
    if (this.timerInstance) {
      this.timerInstance.destroy();
    }
  }
}

// 🔧 Initialize the widget when DOM is ready
let initialized = false;

function initializeTimerWidget() {
  // Prevent multiple initializations
  if (initialized) return;
  
  const timerContainers = document.querySelectorAll('[id^="countdown-timer-"]');
  
  if (timerContainers.length > 0) {
    timerContainers.forEach(container => {
      // Check if already initialized
      if (!container.dataset.timerInitialized) {
        container.dataset.timerInitialized = 'true';
        new TimerWidgetManager(container);
      }
    });
    initialized = true;
  } else {
    // Create default container if none found
    let timerContainer = document.getElementById('countdown-timer-widget');
    
    if (!timerContainer) {
      timerContainer = document.createElement('div');
      timerContainer.id = 'countdown-timer-widget';
      timerContainer.className = 'countdown-timer-container';
      
      const productForm = document.querySelector('.product-form') || 
                         document.querySelector('.product__info') ||
                         document.querySelector('.product-single__info');
      
      if (productForm) {
        productForm.insertBefore(timerContainer, productForm.firstChild);
      } else {
        document.body.appendChild(timerContainer);
      }
    }
    
    if (!timerContainer.dataset.timerInitialized) {
      timerContainer.dataset.timerInitialized = 'true';
      new TimerWidgetManager(timerContainer);
      initialized = true;
    }
  }
}

// Initialize once when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTimerWidget);
} else {
  initializeTimerWidget();
}

// Expose for manual initialization if needed
window.TimerWidgetManager = TimerWidgetManager;
window.CountdownTimer = CountdownTimer;
window.initializeTimerWidget = initializeTimerWidget;
