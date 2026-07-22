(() => {
  const original = document.createElement('script');
  original.src = '/app-original.js?v=4';
  original.async = false;

  original.onload = () => {
    YunseoApp.prototype.init = async function init() {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
          console.warn('Service worker registration failed:', error);
        }
      }

      await Promise.all([
        this.simulateLoading(),
        this.initializeEngine()
      ]);

      this.bindEvents();
      this.render();
    };

    if (document.readyState !== 'loading' && !window.app) {
      window.app = new YunseoApp();
    }
  };

  original.onerror = () => {
    console.error('Failed to load app-original.js');
    const loading = document.getElementById('loading-screen');
    const main = document.getElementById('main-screen');
    if (loading) loading.classList.remove('active');
    if (main) main.classList.add('active');
  };

  document.head.appendChild(original);
})();
