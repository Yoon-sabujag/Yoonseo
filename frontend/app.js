const $ = (id) => document.getElementById(id);

class YunseoApp {
  constructor() {
    this.state = null;
    this.sessionId = localStorage.getItem('yunseo-session') || '';
    this.currentTab = 'status';
    this.init();
  }

  async init() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      await this.initializeEngine();
      this.bindEvents();
      this.render();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.state = this.defaultState();
      this.bindEvents();
      this.render();
      this.toast('초기화 오류로 로컬 상태를 사용합니다');
    } finally {
      $('loading-screen')?.classList.remove('active');
      $('main-screen')?.classList.add('active');
    }
  }

  defaultState() {
    return {
      age: 20,
      days_elapsed: 7300,
      current_date: new Date().toISOString(),
      body: { height_cm: 163, weight_kg: 52, bust_cm: 84, waist_cm: 61, hip_cm: 89, bmi: 19.6 },
      hormones: { estrogen_pg_ml: 210, progesterone_ng_ml: 8, testosterone_ng_ml: 0.32, lh_miu_ml: 9, fsh_miu_ml: 7, cycle_day: 1, fertility_window: false },
      personality: { big_five: { openness: .72, conscientiousness: .64, extraversion: .58, agreeableness: .76, neuroticism: .38 } },
      relationship: { stage: 'stranger', stage_index: 0, metrics: { trust: 0, intimacy: 0, passion: 0, commitment: 0 }, allowed_actions: ['greeting','talk'], days_since_meet: 0 },
      pregnancy: { is_pregnant: false },
      postpartum: { is_postpartum: false },
      children_count: 0,
      children: [],
      mind: { mood: 'neutral', stress: .2, energy: .8, emotions: { joy: .35, trustInUser: .1, attachmentToUser: .05 }, thoughts: [], memory_count: 0 }
    };
  }

  async initializeEngine() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('yunseo-save') || 'null'); } catch {}
    const res = await fetch('/api/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': this.sessionId },
      body: JSON.stringify({ seed: saved?.seed || Math.floor(Math.random() * 100000), state: saved })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API ${res.status}`);
    this.sessionId = data.session_id || this.sessionId;
    this.state = data;
    this.persist();
  }

  persist() {
    if (this.state) localStorage.setItem('yunseo-save', JSON.stringify(this.state));
    if (this.sessionId) localStorage.setItem('yunseo-session', this.sessionId);
  }

  async api(endpoint, body = {}) {
    const res = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-ID': this.sessionId },
      body: JSON.stringify({ ...body, state: this.state })
    });
    const data = await res.json();
    if (data.session_id) this.sessionId = data.session_id;
    if (data.state) this.state = data.state;
    else if (data.age !== undefined) this.state = data;
    this.persist();
    if (!res.ok || data.error) throw new Error(data.error || `API ${res.status}`);
    return data;
  }

  bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => this.switchTab(btn.dataset.tab));
    $('btn-next-day') && ($('btn-next-day').onclick = () => this.advanceDay());
    $('btn-save') && ($('btn-save').onclick = () => { this.persist(); this.toast('저장되었습니다'); });
    $('btn-settings') && ($('btn-settings').onclick = () => this.toast('설정 기능은 준비 중입니다'));
    $('btn-advance-pregnancy') && ($('btn-advance-pregnancy').onclick = () => this.run('/pregnancy/advance', { weeks: 1 }, '임신이 1주 진행되었습니다'));
    $('btn-give-birth') && ($('btn-give-birth').onclick = () => this.run('/pregnancy/birth', {}, '출산 처리가 완료되었습니다'));
    $('btn-advance-postpartum') && ($('btn-advance-postpartum').onclick = () => this.run('/postpartum/advance', { days: 1 }, '산후 회복이 1일 진행되었습니다'));
    $('btn-simulate-growth') && ($('btn-simulate-growth').onclick = () => this.simulateGrowth());
    $('btn-chat-send') && ($('btn-chat-send').onclick = () => this.sendChat());
    $('chat-input') && ($('chat-input').onkeydown = e => { if (e.key === 'Enter') this.sendChat(); });
    this.renderActions();
    this.renderBodyMenus();
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
    this.render();
  }

  async run(endpoint, body, success) {
    try {
      await this.api(endpoint, body);
      this.toast(success);
      this.render();
    } catch (e) { this.toast(e.message); }
  }

  async advanceDay() { await this.run('/advance', { days: 1 }, '하루가 지났습니다'); }

  renderActions() {
    const container = $('action-buttons');
    if (container) {
      const actions = [['greeting','👋 인사하기'],['talk','💬 대화하기'],['praise','✨ 칭찬하기'],['flirt','💕 플러팅'],['touch','🤝 스킨십'],['kiss','💋 키스'],['intimacy','❤️ 친밀감']];
      container.innerHTML = actions.map(([id,label]) => `<button class="action-btn" data-action="${id}">${label}</button>`).join('');
      container.querySelectorAll('button').forEach(btn => btn.onclick = async () => {
        try { const r = await this.api('/interact', { action: btn.dataset.action, intensity: 1 }); this.toast(r.emotion || '완료'); this.render(); }
        catch (e) { this.toast(e.message); }
      });
    }
  }

  renderBodyMenus() {
    const zones = $('erogenous-zones');
    const positions = $('position-buttons');
    if (zones) {
      const items = [['lips','입술'],['neck','목'],['ears','귀'],['shoulders','어깨'],['hands','손'],['back','등'],['waist','허리']];
      zones.innerHTML = items.map(([id,label]) => `<button class="zone-btn" data-zone="${id}">${label}</button>`).join('');
      zones.querySelectorAll('button').forEach(btn => btn.onclick = () => this.toast(`${btn.textContent} 상호작용을 선택했습니다`));
    }
    if (positions) {
      const items = [['embrace','포옹'],['hold_hands','손잡기'],['cuddle','기대기'],['dance','함께 춤추기'],['private_time','둘만의 시간']];
      positions.innerHTML = items.map(([id,label]) => `<button class="action-btn" data-position="${id}">${label}</button>`).join('');
      positions.querySelectorAll('button').forEach(btn => btn.onclick = () => this.toast(`${btn.textContent}을 선택했습니다`));
    }
  }

  bodyMenusUnlocked(s) {
    const rel = s.relationship || {};
    const stage = rel.stage || 'stranger';
    const index = Number(rel.stage_index || 0);
    const metrics = rel.metrics || {};
    const stageUnlocked = ['partner','engaged','spouse'].includes(stage) || index >= 4;
    const metricsUnlocked = Number(metrics.trust || 0) >= 70 && Number(metrics.intimacy || 0) >= 70;
    return Number(s.age || 0) >= 18 && (stageUnlocked || metricsUnlocked);
  }

  updateBodyMenuLocks(s) {
    const unlocked = this.bodyMenusUnlocked(s);
    const zones = $('erogenous-zones');
    const positions = $('position-buttons');
    const zonesLocked = $('zones-locked');
    const positionsLocked = $('positions-locked');

    if (zones) zones.style.display = unlocked ? 'grid' : 'none';
    if (positions) positions.style.display = unlocked ? 'grid' : 'none';
    if (zonesLocked) {
      zonesLocked.style.display = unlocked ? 'none' : 'block';
      zonesLocked.textContent = Number(s.age || 0) < 18 ? '🔒 성인 캐릭터만 이용할 수 있습니다' : '🔒 연인 단계 또는 신뢰·친밀감 70 이상에서 열립니다';
    }
    if (positionsLocked) {
      positionsLocked.style.display = unlocked ? 'none' : 'block';
      positionsLocked.textContent = Number(s.age || 0) < 18 ? '🔒 성인 캐릭터만 이용할 수 있습니다' : '🔒 연인 단계 또는 신뢰·친밀감 70 이상에서 열립니다';
    }
  }

  render() {
    const s = this.state || this.defaultState();
    if ($('char-age')) $('char-age').textContent = `나이: ${s.age}세`;
    if ($('char-date')) $('char-date').textContent = `현재 날짜: ${new Date(s.current_date).toLocaleDateString('ko-KR')}`;
    if ($('char-days')) $('char-days').textContent = `만남 후 ${s.relationship?.days_since_meet || 0}일`;

    const stageNames = { stranger:'낯선 사람', acquaintance:'아는 사람', friend:'친구', close_friend:'친한 친구', partner:'연인', engaged:'약혼', spouse:'배우자' };
    if ($('current-stage')) $('current-stage').textContent = `단계: ${stageNames[s.relationship?.stage] || s.relationship?.stage || '-'}`;
    if ($('stage-progress')) $('stage-progress').style.width = `${((s.relationship?.stage_index || 0) / 6) * 100}%`;

    this.stats('relationship-metrics', s.relationship?.metrics, { trust:'신뢰', intimacy:'친밀감', passion:'열정', commitment:'헌신' });
    this.stats('body-stats', s.body, { height_cm:'신장(cm)', weight_kg:'체중(kg)', bust_cm:'가슴(cm)', waist_cm:'허리(cm)', hip_cm:'엉덩이(cm)', bmi:'BMI' });
    this.stats('hormone-levels', s.hormones, { estrogen_pg_ml:'에스트로겐', progesterone_ng_ml:'프로게스테론', testosterone_ng_ml:'테스토스테론', lh_miu_ml:'LH', fsh_miu_ml:'FSH', hcg_miu_ml:'hCG', prolactin_ng_ml:'프로락틴' }, ['cycle_day','fertility_window','pregnancy_week']);

    if ($('cycle-day')) $('cycle-day').textContent = `생리 주기: ${s.hormones?.cycle_day || 1}일차`;
    if ($('fertility-status')) $('fertility-status').textContent = `가임기: ${s.hormones?.fertility_window ? '예' : '아니오'}`;

    if ($('pregnancy-status')) {
      if (s.pregnancy?.is_pregnant) $('pregnancy-status').innerHTML = `<div class="week-display">${s.pregnancy.week || 0}주차</div>`;
      else if (s.postpartum?.is_postpartum) $('pregnancy-status').innerHTML = `<p>산후 ${s.postpartum.day || 0}일차</p>`;
      else $('pregnancy-status').innerHTML = '<p>임신 중이 아닙니다</p>';
    }
    if ($('postpartum-card')) $('postpartum-card').style.display = s.postpartum?.is_postpartum ? 'block' : 'none';

    if ($('children-list')) {
      $('children-list').innerHTML = (s.children || []).length
        ? s.children.map(c => `<div class="child-card"><div>${c.sex === 'female' ? '👧' : '👦'}</div><div>${c.name || '이름 없음'}</div></div>`).join('')
        : '<p style="text-align:center;color:var(--text-muted)">아직 자녀가 없습니다</p>';
    }

    const allowed = s.relationship?.allowed_actions || [];
    document.querySelectorAll('#action-buttons [data-action]').forEach(b => b.disabled = !allowed.includes(b.dataset.action));
    this.updateBodyMenuLocks(s);
    this.renderMind();
  }

  stats(id, obj = {}, names = {}, exclude = []) {
    const el = $(id); if (!el) return;
    el.innerHTML = Object.entries(obj || {}).filter(([k]) => !exclude.includes(k)).map(([k,v]) => `<div class="stat-item"><div class="stat-label">${names[k] || k}</div><div class="stat-value">${typeof v === 'number' ? Math.round(v * 100) / 100 : v}</div></div>`).join('');
  }

  renderMind() {
    const m = this.state?.mind || {};
    if ($('mind-mood-display')) $('mind-mood-display').innerHTML = `<div style="font-size:4rem">${m.mood === 'happy' ? '😊' : m.mood === 'sad' ? '😢' : '😐'}</div><div>${m.mood || 'neutral'}</div>`;
    this.stats('mind-emotions', m.emotions || {}, { joy:'기쁨', trustInUser:'사용자 신뢰', attachmentToUser:'애착' });
    if ($('mind-thoughts')) $('mind-thoughts').innerHTML = (m.thoughts || []).length ? m.thoughts.map(t => `<div class="log-item">${t.content || t}</div>`).join('') : '<p>특별한 생각이 없습니다</p>';
    if ($('mind-memory')) $('mind-memory').innerHTML = `<div class="stat-item"><div class="stat-label">기억 수</div><div class="stat-value">${m.memory_count || 0}</div></div>`;
  }

  async sendChat() {
    const input = $('chat-input');
    const text = input?.value.trim(); if (!text) return;
    input.value = '';
    this.addChat('user', text);
    try {
      const r = await this.api('/mind/chat', { message: text, context: { relationship: this.state?.relationship } });
      this.addChat('yunseo', r.reply || r.text || '응, 들었어.');
      this.render();
    } catch (e) { this.addChat('yunseo', '지금은 대답하기 어려워.'); }
  }

  addChat(who, text) {
    const box = $('chat-messages'); if (!box) return;
    const div = document.createElement('div'); div.className = `chat-message ${who}`; div.textContent = text; box.appendChild(div); box.scrollTop = box.scrollHeight;
  }

  async simulateGrowth() {
    try {
      const r = await this.api('/child/growth', { child_index: 0, target_months: 24 });
      if ($('growth-log')) $('growth-log').innerHTML = (r.growth_log || []).map(x => `<div class="log-item">${x.month}개월 · ${x.weight_kg}kg · ${x.length_cm}cm</div>`).join('');
    } catch (e) { this.toast(e.message); }
  }

  toast(message) {
    const el = $('toast'); if (!el) return;
    el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2500);
  }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new YunseoApp(); });