(() => {
  const original = document.createElement('script');
  original.src = '/app-original.js?v=7';
  original.async = false;

  original.onload = () => {
    YunseoApp.prototype.init = async function init() {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js?v=3');
          registration.update();
        } catch (error) {
          console.warn('Service worker registration failed:', error);
        }
      }

      await Promise.all([this.simulateLoading(), this.initializeEngine()]);
      this.bindEvents();
      this.render();
    };

    YunseoApp.prototype.initializeEngine = async function initializeEngine() {
      try {
        const saved = localStorage.getItem('yunseo-save');
        const savedState = saved ? JSON.parse(saved) : null;
        const response = await fetch('/api/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seed: savedState?.seed || Math.floor(Math.random() * 100000),
            state: savedState
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `API ${response.status}`);
        this.sessionId = data.session_id;
        this.state = data;
        localStorage.setItem('yunseo-session', this.sessionId || '');
        localStorage.setItem('yunseo-save', JSON.stringify(this.state));

        if (typeof YunseoMind !== 'undefined') {
          this.mind = new YunseoMind({
            ageYears: data.age,
            personality: data.personality,
            relationship: data.relationship,
            hormonal: { getHormoneLevels: () => this.state?.hormones || data.hormones },
            reproductive: data.pregnancy || data.postpartum
          }, data.seed);
        }
      } catch (error) {
        console.error('API init failed:', error);
        this.state = this.getDefaultState();
        this.state.age = 20;
        this.state.seed = Math.floor(Math.random() * 100000);
        if (typeof YunseoMind !== 'undefined') {
          this.mind = new YunseoMind({
            ageYears: this.state.age,
            personality: this.state.personality,
            relationship: this.state.relationship,
            hormonal: { getHormoneLevels: () => this.state.hormones },
            reproductive: this.state.pregnancy || this.state.postpartum
          });
        }
      }
    };

    YunseoApp.prototype.apiCall = async function apiCall(endpoint, body = {}) {
      try {
        const response = await fetch(`/api${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || ''
          },
          body: JSON.stringify({ ...body, state: this.state })
        });
        const result = await response.json();
        if (result.session_id) this.sessionId = result.session_id;
        if (result.state) this.state = result.state;
        else if (result.age !== undefined) this.state = result;
        if (this.state) localStorage.setItem('yunseo-save', JSON.stringify(this.state));
        if (!response.ok) {
          this.showToast(result.error || `요청 실패 (${response.status})`);
          return result;
        }
        return result;
      } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        this.showToast('서버 연결에 실패했습니다');
        return { error: error.message, state: this.state };
      }
    };

    YunseoApp.prototype.saveGame = function saveGame() {
      localStorage.setItem('yunseo-save', JSON.stringify(this.state));
      localStorage.setItem('yunseo-session', this.sessionId || '');
      this.showToast('게임이 저장되었습니다');
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
