const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Session-ID'
};

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const today = () => new Date().toISOString();

function initialState(seed = Math.floor(Math.random() * 100000)) {
  return {
    seed,
    age: 20,
    days_elapsed: 20 * 365,
    current_date: today(),
    body: { height_cm: 163, weight_kg: 52, bust_cm: 84, waist_cm: 61, hip_cm: 89, bmi: 19.6 },
    hormones: {
      estrogen_pg_ml: 210,
      progesterone_ng_ml: 8,
      testosterone_ng_ml: 0.32,
      lh_miu_ml: 9,
      fsh_miu_ml: 7,
      cycle_day: 1,
      fertility_window: false
    },
    personality: {
      big_five: { openness: 0.72, conscientiousness: 0.64, extraversion: 0.58, agreeableness: 0.76, neuroticism: 0.38 },
      sexual_traits: { curiosity: 0.55, drive: 0.5, openness: 0.58, risk_taking: 0.28 }
    },
    relationship: {
      stage: 'stranger', stage_index: 0,
      metrics: { trust: 0, intimacy: 0, passion: 0, commitment: 0 },
      allowed_actions: ['greeting', 'talk'], days_since_meet: 0
    },
    pregnancy: { is_pregnant: false },
    postpartum: { is_postpartum: false },
    children_count: 0,
    children: [],
    mind: {
      mood: 'neutral', stress: 0.2, energy: 0.8,
      emotions: { joy: 0.35, trustInUser: 0.1, attachmentToUser: 0.05 },
      thoughts: [], memory_count: 0
    }
  };
}

function normalizeState(input, seed) {
  const base = initialState(seed);
  if (!input || typeof input !== 'object') return base;
  return {
    ...base, ...input,
    body: { ...base.body, ...(input.body || {}) },
    hormones: { ...base.hormones, ...(input.hormones || {}) },
    personality: {
      ...base.personality, ...(input.personality || {}),
      big_five: { ...base.personality.big_five, ...(input.personality?.big_five || {}) },
      sexual_traits: { ...base.personality.sexual_traits, ...(input.personality?.sexual_traits || {}) }
    },
    relationship: {
      ...base.relationship, ...(input.relationship || {}),
      metrics: { ...base.relationship.metrics, ...(input.relationship?.metrics || {}) }
    },
    pregnancy: { ...base.pregnancy, ...(input.pregnancy || {}) },
    postpartum: { ...base.postpartum, ...(input.postpartum || {}) },
    mind: { ...base.mind, ...(input.mind || {}), emotions: { ...base.mind.emotions, ...(input.mind?.emotions || {}) } },
    children: Array.isArray(input.children) ? input.children : []
  };
}

function stageFromMetrics(metrics) {
  const score = (metrics.trust + metrics.intimacy + metrics.passion + metrics.commitment) / 4;
  if (score >= 80) return ['spouse', 6];
  if (score >= 65) return ['engaged', 5];
  if (score >= 50) return ['partner', 4];
  if (score >= 35) return ['close_friend', 3];
  if (score >= 20) return ['friend', 2];
  if (score >= 8) return ['acquaintance', 1];
  return ['stranger', 0];
}

function allowedActions(stageIndex) {
  const actions = ['greeting', 'talk'];
  if (stageIndex >= 1) actions.push('praise');
  if (stageIndex >= 2) actions.push('flirt');
  if (stageIndex >= 3) actions.push('touch');
  if (stageIndex >= 4) actions.push('kiss', 'intimacy');
  return actions;
}

function updateCycle(state, days) {
  if (state.pregnancy?.is_pregnant) return;
  const d = ((Number(state.hormones.cycle_day || 1) - 1 + days) % 28) + 1;
  state.hormones.cycle_day = d;
  state.hormones.fertility_window = d >= 10 && d <= 16;
  state.hormones.estrogen_pg_ml = Math.round((d <= 14 ? 50 + d * 25 : 400 - (d - 14) * 18) * 10) / 10;
  state.hormones.progesterone_ng_ml = Math.round((d <= 14 ? 1 + d * 0.25 : 5 + (d - 14) * 0.9) * 10) / 10;
}

function adultOnly(state, res) {
  if (Number(state.age) < 18) {
    send(res, 403, { error: 'Adult-only feature', state });
    return false;
  }
  return true;
}

function send(res, status, data) {
  res.statusCode = status;
  Object.entries({ 'Content-Type': 'application/json; charset=utf-8', ...cors }).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise(resolve => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const body = await readBody(req);
  const url = new URL(req.url, 'https://local.invalid');
  const path = url.pathname;
  const state = normalizeState(body.state, body.seed);
  const sessionId = req.headers['x-session-id'] || `ys-${state.seed}`;

  try {
    if (path === '/api/init') return send(res, 200, { session_id: sessionId, ...state });
    if (path === '/api/status') return send(res, 200, { session_id: sessionId, ...state });

    if (path === '/api/interact') {
      const action = body.action || 'talk';
      if (!state.relationship.allowed_actions.includes(action)) return send(res, 403, { error: 'Action locked', state });
      const gains = {
        greeting: [4, 2, 0, 0], talk: [5, 5, 1, 1], praise: [4, 5, 2, 1],
        flirt: [2, 4, 7, 1], touch: [2, 5, 6, 2], kiss: [3, 6, 8, 3], intimacy: [4, 8, 9, 4]
      }[action] || [2, 2, 0, 0];
      const m = state.relationship.metrics;
      [m.trust, m.intimacy, m.passion, m.commitment] = [
        clamp(m.trust + gains[0]), clamp(m.intimacy + gains[1]), clamp(m.passion + gains[2]), clamp(m.commitment + gains[3])
      ];
      const oldStage = state.relationship.stage;
      const [stage, index] = stageFromMetrics(m);
      state.relationship.stage = stage;
      state.relationship.stage_index = index;
      state.relationship.allowed_actions = allowedActions(index);
      state.mind.mood = action === 'praise' ? 'happy' : action === 'flirt' ? 'flirty' : 'neutral';
      state.mind.emotions.joy = clamp((state.mind.emotions.joy || 0) + 0.06, 0, 1);
      state.mind.emotions.trustInUser = clamp((state.mind.emotions.trustInUser || 0) + gains[0] / 100, 0, 1);
      state.mind.memory_count += 1;
      return send(res, 200, { success: true, action, emotion: state.mind.mood, stage_changed: oldStage !== stage, current_stage: stage, metrics: m, state });
    }

    if (path === '/api/stimulate') {
      if (!adultOnly(state, res)) return;
      if (state.relationship.stage_index < 4) return send(res, 403, { error: 'Relationship stage too low', state });
      const response = Math.round(clamp(Number(body.intensity || 0.7), 0, 1) * 100) / 100;
      return send(res, 200, { response, zone: body.zone || 'unknown', state });
    }

    if (path === '/api/advance') {
      const days = clamp(Number(body.days || 1), 1, 365);
      state.days_elapsed += days;
      state.relationship.days_since_meet += days;
      const date = new Date(state.current_date);
      date.setUTCDate(date.getUTCDate() + days);
      state.current_date = date.toISOString();
      state.age = Math.round((state.age + days / 365.25) * 100) / 100;
      updateCycle(state, days);
      if (state.pregnancy?.is_pregnant) state.pregnancy.day = Number(state.pregnancy.day || 0) + days;
      return send(res, 200, { session_id: sessionId, ...state });
    }

    if (path === '/api/sexual-activity') {
      if (!adultOnly(state, res)) return;
      if (state.relationship.stage_index < 4) return send(res, 403, { error: 'Relationship stage too low', state });
      const position = body.position || 'missionary';
      const pleasure = Math.round((0.55 + Math.random() * 0.4) * 100) / 100;
      const pregnancyRisk = state.hormones.fertility_window ? 0.18 : 0.03;
      let pregnancyCheck = { success: false, probability: pregnancyRisk };
      if (!state.pregnancy.is_pregnant && Math.random() < pregnancyRisk) {
        state.pregnancy = { is_pregnant: true, week: 1, day: 0, trimester: 1, body_changes: { weight: { gain_kg: 0 } } };
        pregnancyCheck.success = true;
      }
      return send(res, 200, { position_result: { position, pleasure, pregnancy_risk: pregnancyRisk }, pregnancy_check: pregnancyCheck, state });
    }

    if (path === '/api/pregnancy/advance') {
      if (!adultOnly(state, res)) return;
      if (!state.pregnancy.is_pregnant) return send(res, 400, { error: 'Not pregnant', state });
      const weeks = clamp(Number(body.weeks || 1), 1, 8);
      state.pregnancy.week = Number(state.pregnancy.week || 1) + weeks;
      state.pregnancy.day = Number(state.pregnancy.day || 0) + weeks * 7;
      state.pregnancy.trimester = state.pregnancy.week < 14 ? 1 : state.pregnancy.week < 28 ? 2 : 3;
      state.pregnancy.body_changes = { weight: { gain_kg: Math.round(Math.max(0, state.pregnancy.week - 12) * 0.35 * 10) / 10 } };
      return send(res, 200, { week: state.pregnancy.week, state });
    }

    if (path === '/api/pregnancy/birth') {
      if (!adultOnly(state, res)) return;
      if (!state.pregnancy.is_pregnant || Number(state.pregnancy.week || 0) < 37) return send(res, 400, { error: 'Birth available from week 37', state });
      const child = { name: `윤서아이${state.children.length + 1}`, sex: Math.random() < 0.5 ? 'female' : 'male', birth_date: state.current_date, birth_weight_kg: 3.2, birth_length_cm: 50 };
      state.children.push(child);
      state.children_count = state.children.length;
      state.pregnancy = { is_pregnant: false };
      state.postpartum = { is_postpartum: true, day: 1, uterus: { size_description: 'grapefruit' }, lochia: { type: 'rubra' }, lactation: { stage: 'colostrum', daily_volume_ml: 30 } };
      return send(res, 200, { child, state });
    }

    if (path === '/api/postpartum/advance') {
      if (!adultOnly(state, res)) return;
      if (!state.postpartum.is_postpartum) return send(res, 400, { error: 'Not postpartum', state });
      const days = clamp(Number(body.days || 1), 1, 30);
      state.postpartum.day += days;
      const d = state.postpartum.day;
      state.postpartum.uterus = { size_description: d < 7 ? 'softball' : d < 21 ? 'tennis_ball' : 'pre_pregnancy' };
      state.postpartum.lochia = { type: d <= 3 ? 'rubra' : d <= 10 ? 'serosa' : 'alba' };
      state.postpartum.lactation = { stage: d <= 3 ? 'colostrum' : d <= 14 ? 'transitional' : 'mature', daily_volume_ml: Math.min(900, 30 + d * 25) };
      if (d >= 42) state.postpartum = { is_postpartum: false };
      return send(res, 200, { postpartum_day: d, state });
    }

    if (path === '/api/child/growth') {
      const index = Number(body.child_index || 0);
      const child = state.children[index];
      if (!child) return send(res, 404, { error: 'Child not found', state });
      const target = clamp(Number(body.target_months || 24), 0, 60);
      const growth_log = [];
      for (let month = 0; month <= target; month += 3) {
        growth_log.push({ month, weight_kg: Math.round((child.birth_weight_kg + month * 0.42) * 10) / 10, length_cm: Math.round((child.birth_length_cm + month * 1.65) * 10) / 10, milestones: { milestones: { gross_motor: month < 6 ? '머리 들기' : month < 12 ? '기기' : month < 18 ? '걷기' : '뛰기' } } });
      }
      return send(res, 200, { child_name: child.name, growth_log, state });
    }

    if (path === '/api/mind/status') return send(res, 200, { ...state.mind, state });
    if (path === '/api/mind/chat') {
      const message = String(body.message || '').trim();
      const text = message ? `“${message}”라고 했구나. 네 말을 잘 듣고 있어.` : '무슨 이야기를 하고 싶어?';
      state.mind.memory_count += message ? 1 : 0;
      state.mind.thoughts = message ? [{ type: 'conversation', content: message, intensity: 0.5 }] : state.mind.thoughts;
      return send(res, 200, { text, mood: state.mind.mood, state });
    }

    return send(res, 404, { error: 'Not found', path, state });
  } catch (error) {
    return send(res, 500, { error: error.message, state });
  }
}
