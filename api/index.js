/**
 * 윤서 API - Vercel Serverless Functions
 * Python 엔진을 JS로 포팅한 버전
 */

// ========== 유틸리티 ==========
const rng = (seed) => {
    let s = seed || Math.floor(Math.random() * 100000);
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
};

const rand = (min, max, gen) => min + (gen() * (max - min));
const gauss = (gen) => {
    let u = 0, v = 0;
    while (u === 0) u = gen();
    while (v === 0) v = gen();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// ========== 유전 엔진 ==========
class GeneticEngine {
    constructor(seed) { this.gen = rng(seed); }
    generateDna(p1, p2) {
        const traits = ['height','weight_tendency','skin_tone','hair_texture','eye_color','body_frame','metabolism','fertility','hormone_sensitivity','stress_resilience','libido_baseline','aesthetic_preference','social_drive','curiosity','empathy','assertiveness','risk_taking'];
        const dna = {};
        for (const t of traits) {
            if (p1 && p2 && p1[t] !== undefined && p2[t] !== undefined) {
                const base = (p1[t] + p2[t]) / 2;
                const mutation = this.gen() < 0.01 ? gauss(this.gen) * 0.1 : 0;
                dna[t] = Math.max(0, Math.min(1, base + mutation));
            } else {
                dna[t] = this.gen();
            }
        }
        return dna;
    }
    getFertilityBonus(dna) { return (dna.fertility || 0.5) * 0.05; }
}

// ========== 성장 엔진 ==========
class GrowthEngine {
    static GROWTH = {
        0:[49,3.2],1:[54,4.5],2:[58,5.5],3:[61,6.2],4:[64,6.8],5:[67,7.4],6:[69.5,7.9],7:[72,8.4],
        8:[74,8.8],9:[76,9.2],10:[78,9.6],11:[80,10],12:[82,10.4],13:[84,10.8],14:[86,11.2],15:[88,11.6],
        16:[90,12],17:[91.5,12.4],18:[93,12.8],19:[94.5,13.2],20:[96,13.6],21:[97.5,14],22:[99,14.4],
        23:[100.5,14.8],24:[102,15.2],30:[108,16.5],36:[114,18],48:[124,22],60:[132,26],72:[140,30],
        84:[148,35],96:[155,42],108:[160,48],120:[163,50],132:[164.5,51.5],144:[165.5,52.5],
        156:[166,53],168:[166.2,53.2],180:[166.3,53.3],192:[166.5,53.5],204:[166.5,53.5],
        216:[166.5,53.5],228:[166.5,53.5]
    };
    constructor(dna, seed) {
        this.gen = rng(seed);
        this.dna = dna;
        this.heightGene = dna.height || 0.5;
        this.weightGene = dna.weight_tendency || 0.5;
    }
    getBodyAtAge(age) {
        const months = Math.floor(age * 12);
        const keys = Object.keys(GrowthEngine.GROWTH).map(Number).sort((a,b)=>a-b);
        const closest = keys.reduce((p,c)=>Math.abs(c-months)<Math.abs(p-months)?c:p, keys[0]);
        const [bh, bw] = GrowthEngine.GROWTH[closest];
        const h = bh * (0.9 + this.heightGene * 0.2);
        const w = bw * (0.85 + this.weightGene * 0.3);
        const puberty = 10.5;
        let bust, waist, hip;
        if (age < puberty) {
            bust = w * 0.5 + age * 2;
            waist = w * 0.45 + age * 1.5;
            hip = w * 0.55 + age * 2;
        } else {
            bust = 70 + (age - puberty) * 3 + gauss(this.gen) * 3;
            waist = 55 + (age - puberty) * 1.5 + gauss(this.gen) * 2;
            hip = 75 + (age - puberty) * 2.5 + gauss(this.gen) * 3;
        }
        return {
            height_cm: Math.round(h*10)/10, weight_kg: Math.round(w*10)/10,
            bust_cm: Math.round(bust*10)/10, waist_cm: Math.round(waist*10)/10,
            hip_cm: Math.round(hip*10)/10, bmi: Math.round(w/((h/100)**2)*10)/10
        };
    }
}

// ========== 호륜 엔진 ==========
class HormonalEngine {
    constructor(dna, seed) {
        this.gen = rng(seed);
        this.dna = dna;
        this.cycleDay = 1;
        this.isPregnant = false;
        this.pregnancyWeek = 0;
    }
    getHormoneLevels(day) {
        const d = day || this.cycleDay;
        if (this.isPregnant) {
            const w = this.pregnancyWeek;
            const hcg = w <= 4 ? 5 + w * 500 : w <= 8 ? 2000 + (w-4)*15000 : w <= 12 ? 80000 - (w-8)*5000 : Math.max(5000, 60000 - (w-12)*1000);
            return {
                estrogen_pg_ml: Math.round((400 + w * 100)*10)/10,
                progesterone_ng_ml: Math.round((20 + w * 0.5)*10)/10,
                testosterone_ng_ml: 0.3, lh_miu_ml: 0.1, fsh_miu_ml: 0.1,
                hcg_miu_ml: Math.round(hcg*10)/10,
                prolactin_ng_ml: Math.round((10 + w * 5)*10)/10,
                relaxin_ng_ml: Math.round((0.5 + w * 0.1)*100)/100,
                pregnancy_week: w, fertility_window: false
            };
        }
        const estrogen = d <= 14 ? 50 + (d/14)*350 : 400 - ((d-14)/14)*250;
        const progesterone = d <= 14 ? 1 + (d/14)*4 : 5 + ((d-14)/14)*15;
        const testosterone = (d >= 10 && d <= 16) ? 0.4 + 0.2*this.gen() : 0.2 + 0.1*this.gen();
        const lh = (d >= 12 && d <= 16) ? 20 + 80*this.gen() : 5 + 10*this.gen();
        const fsh = 5 + 15*this.gen();
        return {
            estrogen_pg_ml: Math.round(estrogen*10)/10,
            progesterone_ng_ml: Math.round(progesterone*10)/10,
            testosterone_ng_ml: Math.round(testosterone*100)/100,
            lh_miu_ml: Math.round(lh*10)/10,
            fsh_miu_ml: Math.round(fsh*10)/10,
            cycle_day: d, fertility_window: d >= 10 && d <= 16
        };
    }
    advanceCycle(days) {
        if (this.isPregnant) { this.pregnancyWeek += days/7; return; }
        this.cycleDay = ((this.cycleDay - 1 + days) % 28) + 1;
    }
    getCervicalMucus() {
        if (this.isPregnant) return 'thick_plug';
        const d = this.cycleDay;
        if (d <= 5) return 'dry'; if (d <= 10) return 'sticky'; if (d <= 12) return 'creamy';
        if (d <= 16) return 'egg_white_stretchy'; if (d <= 20) return 'watery';
        return 'sticky';
    }
    getCervicalMucusQuality() {
        const q = { dry: 0.001, sticky: 0.01, creamy: 0.05, egg_white_stretchy: 0.15, watery: 0.20, thick_plug: 0.0 };
        return q[this.getCervicalMucus()] || 0.01;
    }
}

// ========== 성격 시스템 ==========
class PersonalitySystem {
    constructor(dna, seed) {
        this.gen = rng(seed);
        this.dna = dna;
        this.openness = dna.curiosity || 0.5;
        this.conscientiousness = dna.assertiveness || 0.5;
        this.extraversion = dna.social_drive || 0.5;
        this.agreeableness = dna.empathy || 0.5;
        this.neuroticism = 1 - (dna.stress_resilience || 0.5);
        this.sexualCuriosity = (dna.curiosity || 0.5) * 0.7 + this.openness * 0.3;
        this.sexualDrive = dna.libido_baseline || 0.5;
        this.sexualOpenness = this.openness * 0.6 + this.sexualCuriosity * 0.4;
        this.riskTaking = dna.risk_taking || 0.5;
    }
    getSummary() {
        return {
            big_five: {
                openness: Math.round(this.openness*100)/100,
                conscientiousness: Math.round(this.conscientiousness*100)/100,
                extraversion: Math.round(this.extraversion*100)/100,
                agreeableness: Math.round(this.agreeableness*100)/100,
                neuroticism: Math.round(this.neuroticism*100)/100
            },
            sexual_traits: {
                curiosity: Math.round(this.sexualCuriosity*100)/100,
                drive: Math.round(this.sexualDrive*100)/100,
                openness: Math.round(this.sexualOpenness*100)/100,
                risk_taking: Math.round(this.riskTaking*100)/100
            }
        };
    }
    getReaction(action) {
        const r = { greeting: ['neutral',0.3], talk: ['curious',0.4], praise: ['happy',0.5], flirt: ['flustered',0.6], touch: ['nervous',0.7], kiss: ['excited',0.8], intimacy: ['aroused',0.9] };
        return r[action] || ['neutral', 0.3];
    }
}

// ========== 성적 시스템 ==========
class SexualSystem {
    static POSITIONS = {
        missionary: { intimacy: 0.8, pleasure: 0.7, difficulty: 0.2, pregnancy_risk: 0.9 },
        doggy: { intimacy: 0.5, pleasure: 0.9, difficulty: 0.3, pregnancy_risk: 0.85 },
        cowgirl: { intimacy: 0.7, pleasure: 0.85, difficulty: 0.4, pregnancy_risk: 0.8 },
        spooning: { intimacy: 0.9, pleasure: 0.6, difficulty: 0.2, pregnancy_risk: 0.7 },
        standing: { intimacy: 0.5, pleasure: 0.7, difficulty: 0.7, pregnancy_risk: 0.6 },
        lotus: { intimacy: 0.95, pleasure: 0.75, difficulty: 0.5, pregnancy_risk: 0.85 },
        butterfly: { intimacy: 0.6, pleasure: 0.8, difficulty: 0.6, pregnancy_risk: 0.75 },
        reverse_cowgirl: { intimacy: 0.4, pleasure: 0.9, difficulty: 0.5, pregnancy_risk: 0.8 },
        side_by_side: { intimacy: 0.85, pleasure: 0.65, difficulty: 0.3, pregnancy_risk: 0.7 },
        prone_bone: { intimacy: 0.4, pleasure: 0.85, difficulty: 0.3, pregnancy_risk: 0.9 },
        seated: { intimacy: 0.75, pleasure: 0.7, difficulty: 0.4, pregnancy_risk: 0.8 },
        wheelbarrow: { intimacy: 0.3, pleasure: 0.8, difficulty: 0.9, pregnancy_risk: 0.5 },
        scissors: { intimacy: 0.7, pleasure: 0.75, difficulty: 0.5, pregnancy_risk: 0.6 },
        bridge: { intimacy: 0.5, pleasure: 0.8, difficulty: 0.8, pregnancy_risk: 0.7 },
        table: { intimacy: 0.6, pleasure: 0.75, difficulty: 0.4, pregnancy_risk: 0.85 },
        suspended: { intimacy: 0.4, pleasure: 0.85, difficulty: 0.95, pregnancy_risk: 0.4 }
    };
    static ZONES = {
        lips: { sensitivity: 0.9, intimacy_level: 1 }, neck: { sensitivity: 0.85, intimacy_level: 2 },
        ears: { sensitivity: 0.8, intimacy_level: 2 }, breasts: { sensitivity: 0.9, intimacy_level: 3 },
        nipples: { sensitivity: 0.95, intimacy_level: 3 }, navel: { sensitivity: 0.6, intimacy_level: 3 },
        inner_thighs: { sensitivity: 0.9, intimacy_level: 4 }, clitoris: { sensitivity: 1.0, intimacy_level: 5 },
        vagina: { sensitivity: 0.95, intimacy_level: 5 }, g_spot: { sensitivity: 0.98, intimacy_level: 5 },
        cervix: { sensitivity: 0.7, intimacy_level: 5 }, perineum: { sensitivity: 0.85, intimacy_level: 4 },
        buttocks: { sensitivity: 0.75, intimacy_level: 3 }, lower_back: { sensitivity: 0.7, intimacy_level: 2 },
        scalp: { sensitivity: 0.65, intimacy_level: 1 }
    };
    constructor(personality, seed) {
        this.gen = rng(seed);
        this.personality = personality;
        this.experienceLevel = 0;
        this.discoveredZones = new Set();
        this.preferredPositions = [];
        this.preferredPlays = [];
    }
    getPositionResult(position, intensity) {
        if (!SexualSystem.POSITIONS[position]) return { error: 'Unknown position' };
        const pos = SexualSystem.POSITIONS[position];
        const expBonus = Math.min(this.experienceLevel * 0.2, 0.3);
        const opennessBonus = this.personality.sexualOpenness * 0.1;
        const driveBonus = this.personality.sexualDrive * 0.1;
        const pleasure = Math.min(1, pos.pleasure + expBonus + opennessBonus + driveBonus);
        const intimacy = Math.min(1, pos.intimacy + opennessBonus);
        const orgasmChance = pleasure * intensity * (0.5 + this.experienceLevel * 0.3);
        const orgasm = this.gen() < orgasmChance;
        this.experienceLevel = Math.min(1, this.experienceLevel + 0.05);
        return { position, pleasure: Math.round(pleasure*100)/100, intimacy: Math.round(intimacy*100)/100, orgasm, pregnancy_risk: pos.pregnancy_risk, difficulty: pos.difficulty };
    }
    stimulateZone(zone, intensity) {
        if (!SexualSystem.ZONES[zone]) return { error: 'Unknown zone' };
        const z = SexualSystem.ZONES[zone];
        const response = z.sensitivity * intensity * (0.5 + this.personality.sexualDrive * 0.5);
        this.discoveredZones.add(zone);
        return { zone, sensitivity: z.sensitivity, response: Math.round(response*100)/100, pleasure: Math.round(response*intensity*100)/100, intimacy_required: z.intimacy_level };
    }
}

// ========== 관계 시스템 ==========
class RelationshipSystem {
    static STAGES = ['stranger','acquaintance','friend','close_friend','partner','engaged','spouse'];
    static REQUIREMENTS = {
        stranger: { trust: 0, intimacy: 0, passion: 0, commitment: 0 },
        acquaintance: { trust: 20, intimacy: 10, passion: 5, commitment: 0 },
        friend: { trust: 40, intimacy: 25, passion: 10, commitment: 5 },
        close_friend: { trust: 60, intimacy: 45, passion: 20, commitment: 15 },
        partner: { trust: 70, intimacy: 65, passion: 50, commitment: 40 },
        engaged: { trust: 85, intimacy: 80, passion: 60, commitment: 80 },
        spouse: { trust: 95, intimacy: 90, passion: 70, commitment: 100 }
    };
    static ACTIONS = {
        stranger: ['greeting','talk'], acquaintance: ['greeting','talk','praise'],
        friend: ['greeting','talk','praise','flirt','touch'],
        close_friend: ['greeting','talk','praise','flirt','touch','kiss'],
        partner: ['greeting','talk','praise','flirt','touch','kiss','intimacy'],
        engaged: ['greeting','talk','praise','flirt','touch','kiss','intimacy'],
        spouse: ['greeting','talk','praise','flirt','touch','kiss','intimacy']
    };
    constructor(seed) {
        this.gen = rng(seed);
        this.currentStage = 'stranger';
        this.stageIndex = 0;
        this.metrics = { trust: 0, intimacy: 0, passion: 0, commitment: 0 };
        this.history = [];
        this.daysSinceMeet = 0;
    }
    getAllowedActions() { return RelationshipSystem.ACTIONS[this.currentStage] || ['greeting','talk']; }
    interact(action, intensity, personality) {
        if (!this.getAllowedActions().includes(action)) {
            return { success: false, reason: `Action "${action}" not allowed at stage "${this.currentStage}"`, current_stage: this.currentStage };
        }
        const [emotion] = personality.getReaction(action);
        const effects = {
            greeting: { trust: 2, intimacy: 1, passion: 0, commitment: 0 },
            talk: { trust: 3, intimacy: 2, passion: 1, commitment: 1 },
            praise: { trust: 2, intimacy: 3, passion: 2, commitment: 1 },
            flirt: { trust: 1, intimacy: 4, passion: 5, commitment: 2 },
            touch: { trust: 3, intimacy: 5, passion: 4, commitment: 2 },
            kiss: { trust: 4, intimacy: 7, passion: 8, commitment: 5 },
            intimacy: { trust: 5, intimacy: 10, passion: 12, commitment: 8 }
        };
        const eff = effects[action] || { trust: 1, intimacy: 1, passion: 0, commitment: 0 };
        for (const key of Object.keys(this.metrics)) {
            const gain = eff[key] * intensity * (0.8 + this.gen() * 0.4);
            this.metrics[key] = Math.min(100, this.metrics[key] + gain);
        }
        const stageChanged = this.checkAdvance();
        this.history.push({ action, intensity, emotion, metrics_after: { ...this.metrics } });
        return { success: true, emotion, stage_changed: stageChanged, current_stage: this.currentStage, metrics: { trust: Math.round(this.metrics.trust*10)/10, intimacy: Math.round(this.metrics.intimacy*10)/10, passion: Math.round(this.metrics.passion*10)/10, commitment: Math.round(this.metrics.commitment*10)/10 } };
    }
    checkAdvance() {
        if (this.stageIndex >= RelationshipSystem.STAGES.length - 1) return false;
        const next = RelationshipSystem.STAGES[this.stageIndex + 1];
        const req = RelationshipSystem.REQUIREMENTS[next];
        if (Object.keys(req).every(k => this.metrics[k] >= req[k])) {
            this.stageIndex++;
            this.currentStage = next;
            return true;
        }
        return false;
    }
    getStatus() {
        return { stage: this.currentStage, stage_index: this.stageIndex, metrics: { trust: Math.round(this.metrics.trust*10)/10, intimacy: Math.round(this.metrics.intimacy*10)/10, passion: Math.round(this.metrics.passion*10)/10, commitment: Math.round(this.metrics.commitment*10)/10 }, allowed_actions: this.getAllowedActions(), days_since_meet: this.daysSinceMeet };
    }
}

// ========== 생식 시스템 ==========
class ReproductiveSystem {
    constructor(dna, hormonal, growth, seed) {
        this.gen = rng(seed);
        this.dna = dna;
        this.hormonal = hormonal;
        this.growth = growth;
        this.isPregnant = false;
        this.pregnancyWeek = 0;
        this.pregnancyDay = 0;
        this.postpartumDay = 0;
        this.isPostpartum = false;
        this.children = [];
        this.history = [];
        this.fertilityBonus = new GeneticEngine().getFertilityBonus(dna);
    }
    simulateEjaculation(arousal = 0.7, abstinence = 3) {
        const vol = Math.max(1.5, Math.min(8, 2.0 + arousal * 4.0 + gauss(this.gen) * 0.5));
        const baseConc = 60 + arousal * 40;
        const mult = abstinence < 1 ? 0.6 : abstinence <= 3 ? 1.0 : abstinence <= 7 ? 1.2 : 1.0;
        const conc = Math.max(15, Math.min(150, baseConc * mult + gauss(this.gen) * 10));
        const total = vol * conc;
        const motility = Math.max(0.30, Math.min(0.70, 0.40 + arousal * 0.20 + gauss(this.gen) * 0.05));
        const morphology = Math.max(0.02, Math.min(0.15, 0.04 + arousal * 0.06 + gauss(this.gen) * 0.02));
        return { semen_volume_ml: Math.round(vol*100)/100, sperm_count_per_ml_million: Math.round(conc*10)/10, total_sperm_million: Math.round(total*10)/10, sperm_motility_percent: Math.round(motility*1000)/10, sperm_morphology_percent: Math.round(morphology*1000)/10, viable_sperm_million: Math.round(total * motility * morphology * 100)/100, abstinence_days: abstinence, abstinence_multiplier: Math.round(mult*100)/100 };
    }
    calcFertilizationProb(sperm, age) {
        const viable = sperm.viable_sperm_million;
        const mucusQ = this.hormonal.getCervicalMucusQuality();
        const cervicalPass = viable * mucusQ;
        const fallopian = cervicalPass * 0.001;
        const eggMeet = fallopian > 0 ? Math.min(0.9, fallopian / 100) : 0;
        const eggQuality = (age >= 20 && age <= 29) ? 0.85 : Math.max(0.5, 0.85 - Math.abs(age - 25) * 0.02);
        return Math.min(0.95, Math.max(0, eggMeet * 0.75 * eggQuality));
    }
    calcImplantationProb() {
        const hl = this.hormonal.getHormoneLevels();
        const prog = hl.progesterone_ng_ml || 15;
        const endo = Math.min(1, prog / 20);
        const embryo = Math.max(0.5, Math.min(1, 0.80 + gauss(this.gen) * 0.1));
        return Math.min(0.90, Math.max(0, 0.40 * endo * embryo));
    }
    calcPregnancyProb(sperm, age) {
        const fert = this.calcFertilizationProb(sperm, age);
        const impl = this.calcImplantationProb();
        const base = fert * impl;
        const adjusted = 0.22 * (base / 0.15) + this.fertilityBonus + this.ageAdjustment(age);
        return { fertilization_probability: Math.round(fert*10000)/10000, implantation_probability: Math.round(impl*10000)/10000, base_pregnancy_probability: Math.round(base*10000)/10000, genetic_bonus: Math.round(this.fertilityBonus*10000)/10000, age_adjustment: Math.round(this.ageAdjustment(age)*10000)/10000, final_probability: Math.round(Math.min(0.35, Math.max(0.05, adjusted))*10000)/10000, fertility_window: this.hormonal.getHormoneLevels().fertility_window };
    }
    ageAdjustment(age) {
        if (age < 15) return -0.10; if (age < 20) return -0.03; if (age < 30) return 0.0;
        if (age < 35) return -0.03; return -0.08;
    }
    attemptPregnancy(sperm, age, date) {
        if (this.isPregnant || this.isPostpartum) return { success: false, reason: 'Already pregnant or postpartum' };
        const prob = this.calcPregnancyProb(sperm, age);
        const success = this.gen() < prob.final_probability;
        if (success) {
            this.isPregnant = true; this.pregnancyWeek = 0; this.pregnancyDay = 0;
            this.hormonal.isPregnant = true; this.hormonal.pregnancyWeek = 0;
        }
        return { success, probability: Math.round(prob.final_probability*10000)/10000, details: prob, pregnancy_started: success };
    }
    advancePregnancy(weeks = 1) {
        if (!this.isPregnant) return { error: 'Not pregnant' };
        this.pregnancyWeek += weeks; this.pregnancyDay += weeks * 7;
        this.hormonal.pregnancyWeek = this.pregnancyWeek;
        const changes = this.getPregnancyBodyChanges();
        if (this.pregnancyWeek >= 40) return { week: this.pregnancyWeek, ready_for_birth: true, body_changes: changes };
        return { week: this.pregnancyWeek, day: this.pregnancyDay, trimester: this.getTrimester(), body_changes: changes, hormones: this.hormonal.getHormoneLevels() };
    }
    getTrimester() { if (this.pregnancyWeek <= 12) return 1; if (this.pregnancyWeek <= 27) return 2; return 3; }
    getPregnancyBodyChanges() {
        const w = this.pregnancyWeek;
        const bb = this.growth.getBodyAtAge(20);
        const wg = w <= 12 ? w * 0.5 : w <= 27 ? 6 + (w-12)*0.4 : 12 + (w-27)*0.5;
        return { week: w, trimester: this.getTrimester(), weight: { base_kg: bb.weight_kg, gain_kg: Math.round(wg*10)/10, current_kg: Math.round((bb.weight_kg + wg)*10)/10 }, breasts: { size_increase_cm: w < 4 ? 0 : Math.round(Math.min(7, (w-4)*0.25)*10)/10, nipple_darkening: w < 4 ? 0 : Math.round(Math.min(10, (w-4)*0.35)*10)/10, colostrum_secretion: w < 16 ? 0 : Math.round((w-16)*0.5*10)/10 }, belly: { visible: w >= 12, size: w < 12 ? 'none' : w < 16 ? 'slight_bulge' : w < 28 ? 'noticeable' : w < 36 ? 'prominent' : 'full_term', fundal_height_cm: w < 12 ? 0 : Math.round((w-12)*10)/10, stretch_marks_risk: w > 20 ? Math.round(Math.min(10, (w-20)*0.5)*10)/10 : 0 }, uterus_height_cm: w < 12 ? 0 : Math.round((w-12)*10)/10 };
    }
    giveBirth(date) {
        if (!this.isPregnant) return { error: 'Not pregnant' };
        if (this.pregnancyWeek < 37) return { error: 'Too early for birth', week: this.pregnancyWeek };
        const deliveryType = this.gen() < 0.85 ? 'vaginal' : 'cesarean';
        const child = this.generateChild(date);
        this.children.push(child);
        this.history.push({ start_date: date, birth_date: date, duration_weeks: this.pregnancyWeek, delivery_type: deliveryType, child });
        this.isPregnant = false; this.pregnancyWeek = 0; this.pregnancyDay = 0;
        this.hormonal.isPregnant = false; this.hormonal.pregnancyWeek = 0;
        this.isPostpartum = true; this.postpartumDay = 0;
        return { event: 'birth', delivery_type: deliveryType, child, postpartum_started: true };
    }
    generateChild(date) {
        const sex = this.gen() < 0.5 ? 'female' : 'male';
        const childDna = new GeneticEngine(Math.floor(this.gen()*10000)).generateDna(this.dna, this.dna);
        return { sex, birth_date: date.toISOString ? date.toISOString() : date, birth_weight_kg: Math.round((2.8 + gauss(this.gen)*0.4)*100)/100, birth_length_cm: Math.round((48 + gauss(this.gen)*2)*10)/10, apgar_score: Math.floor(this.gen()*4)+7, dna: childDna, name: null };
    }
    advancePostpartum(days = 1) {
        if (!this.isPostpartum) return { error: 'Not in postpartum period' };
        this.postpartumDay += days;
        if (this.postpartumDay >= 42) {
            this.isPostpartum = false; this.postpartumDay = 0;
            return { postpartum_day: 0, status: 'recovered', message: 'Postpartum period completed' };
        }
        const d = this.postpartumDay;
        const uterus = d <= 1 ? { fundal_height_cm: 12, size_description: 'grapefruit', recovery_percent: Math.min(100, d*2.4) } : d <= 3 ? { fundal_height_cm: 10, size_description: 'softball', recovery_percent: Math.min(100, d*2.4) } : d <= 7 ? { fundal_height_cm: 7, size_description: 'baseball', recovery_percent: Math.min(100, d*2.4) } : d <= 14 ? { fundal_height_cm: 3, size_description: 'tennis_ball', recovery_percent: Math.min(100, d*2.4) } : d <= 21 ? { fundal_height_cm: 0, size_description: 'normal', recovery_percent: Math.min(100, d*2.4) } : { fundal_height_cm: 0, size_description: 'pre_pregnancy', recovery_percent: Math.min(100, d*2.4) };
        const lochia = d <= 3 ? { type: 'rubra', color: 'bright_red', amount: 'heavy' } : d <= 10 ? { type: 'serosa', color: 'pink_brown', amount: 'moderate' } : { type: 'alba', color: 'white_yellow', amount: 'light' };
        let stage, color, vol, ab;
        if (d <= 3) { stage = 'colostrum'; color = 'golden_yellow'; vol = 30; ab = 'very_high'; }
        else if (d <= 14) { stage = 'transitional'; color = 'creamy_white'; vol = 200 + (d-3)*30; ab = 'high'; }
        else { stage = 'mature'; color = 'white'; vol = Math.min(1000, 500 + (d-14)*20); ab = 'moderate'; }
        const prolactin = d <= 7 ? 300 - d*7 : d <= 30 ? 250 - (d-7)*2 : d <= 90 ? 200 - (d-30)*0.8 : 150;
        const lactation = { stage, color, daily_volume_ml: vol, antibodies: ab, prolactin_ng_ml: Math.round(prolactin*10)/10, oxytocin_reflex: d > 2 };
        return { postpartum_day: d, uterus, lochia, lactation, hormone_recovery: { estrogen_pg_ml: Math.round(Math.min(400, d*10)*10)/10, progesterone_ng_ml: Math.round(Math.min(20, 1+d*0.5)*10)/10, hcg_miu_ml: Math.round(Math.max(0, 1000-d*20)*10)/10, cycle_resumed: d > 21 }, physical_recovery: { immediate_weight_loss_kg: 6.0, ongoing_weight_loss_kg: Math.round(0.5*(d/7)*100)/100, melasma_fade_percent: Math.round(Math.min(1, d/84)*1000)/10, linea_nigra_fade_percent: Math.round(Math.min(1, d/168)*1000)/10, nipple_color_recovery_percent: Math.round(Math.min(1, d/112)*1000)/10, stretch_marks: 'permanent_but_fade' } };
    }
    getPregnancyStatus() {
        if (!this.isPregnant) return { is_pregnant: false };
        return { is_pregnant: true, week: this.pregnancyWeek, day: this.pregnancyDay, trimester: this.getTrimester(), body_changes: this.getPregnancyBodyChanges(), hormones: this.hormonal.getHormoneLevels() };
    }
    getPostpartumStatus() {
        if (!this.isPostpartum) return { is_postpartum: false };
        const s = this.advancePostpartum(0);
        return { is_postpartum: true, day: this.postpartumDay, uterus: s.uterus, lochia: s.lochia, lactation: s.lactation };
    }
}

// ========== 아이 성장 시스템 ==========
class ChildGrowthSystem {
    static SURNAMES = ['김','이','박','최','정','강','조','윤','장','임'];
    static NAMES_F = ['서연','민서','지우','서현','지민','수아','지유','채원','지윤','은서','수빈','지안','소윤','예은','수민','지원','예린','윤서','예진','소민','지은','수연','예원','민지','서영','채은','유진','지현','소연','예지'];
    static NAMES_M = ['민준','서준','도윤','예준','시우','하준','지호','주원','준우','준서','건우','현우','민재','우진','은우','시윤','지훈','지환','재윤','민우','준영','도현','성민','민성','윤재','정우','태윤','민규','재민','승우'];
    static MILESTONES = {
        0: { gross_motor: '대칭적 움직임', visual_motor: '시선 고정', language: '소리에 반응', social: '얼굴 인지' },
        2: { gross_motor: '머리 가운데 유지', visual_motor: '물체 따라감', language: '쿠잉, 사회적 미소', social: '부모 인지' },
        4: { gross_motor: '팔로 지탱', visual_motor: '두 손으로 뻗음', language: '웃음', social: '주위 인지' },
        6: { gross_motor: '삼각 앉기', visual_motor: '한 손으로 뻗음', language: '옹알이', social: '낯선 사람 인지' },
        9: { gross_motor: '기어다님', visual_motor: '손끝 집기', language: '엄마-아빠', social: '행동 따라함' },
        12: { gross_motor: '걸음', visual_motor: '성숙한 손끝 집기', language: '1-2단어', social: '이름에 반응' },
        18: { gross_motor: '뛰기', visual_motor: '3블록 쌓기', language: '2단어 문장', social: '다른 아이와 놀기' },
        24: { gross_motor: '계단 오르기', visual_motor: '7블록 쌓기', language: '50단어', social: '병행 놀이' }
    };
    constructor(seed) { this.gen = rng(seed); }
    generateName(sex, style = 'traditional') {
        const surname = ChildGrowthSystem.SURNAMES[Math.floor(this.gen() * ChildGrowthSystem.SURNAMES.length)];
        const names = sex === 'female' ? ChildGrowthSystem.NAMES_F : ChildGrowthSystem.NAMES_M;
        const given = names[Math.floor(this.gen() * names.length)];
        return surname + given;
    }
    getMilestones(months) {
        const keys = Object.keys(ChildGrowthSystem.MILESTONES).map(Number).sort((a,b)=>a-b);
        const closest = keys.filter(k => k <= months).pop() || 0;
        const next = keys.find(k => k > months);
        return { age_months: months, closest_milestone_month: closest, milestones: ChildGrowthSystem.MILESTONES[closest] || {}, next_milestone: next ? { month: next, milestones: ChildGrowthSystem.MILESTONES[next] } : null };
    }
    simulateGrowth(child, targetMonths = 24) {
        const log = [];
        const bw = child.birth_weight_kg || 3.0;
        const bl = child.birth_length_cm || 50.0;
        for (let m = 0; m <= targetMonths; m += 3) {
            let w, l;
            if (m <= 6) { w = bw + m * 0.6; l = bl + m * 2.5; }
            else if (m <= 12) { w = bw + 3.6 + (m-6)*0.4; l = bl + 15 + (m-6)*1.5; }
            else { w = bw + 6.0 + (m-12)*0.25; l = bl + 24 + (m-12)*0.8; }
            log.push({ month: m, weight_kg: Math.round(w*100)/100, length_cm: Math.round(l*10)/10, milestones: this.getMilestones(m) });
        }
        return log;
    }
    assignName(child, style = 'traditional') {
        child.name = this.generateName(child.sex || 'female', style);
        return child;
    }
}

// ========== 통합 엔진 ==========
class YunseoEngine {
    constructor(seed, birthDate) {
        this.gen = rng(seed);
        this.seed = seed;
        this.birthDate = birthDate || new Date('2013-01-01');
        this.currentDate = new Date(this.birthDate);
        this.daysElapsed = 0;
        this.ageYears = 0;
        this.genetic = new GeneticEngine(seed);
        this.dna = this.genetic.generateDna();
        this.growth = new GrowthEngine(this.dna, seed);
        this.hormonal = new HormonalEngine(this.dna, seed);
        this.personality = new PersonalitySystem(this.dna, seed);
        this.sexual = new SexualSystem(this.personality, seed);
        this.relationship = new RelationshipSystem(seed);
        this.reproductive = new ReproductiveSystem(this.dna, this.hormonal, this.growth, seed);
        this.childGrowth = new ChildGrowthSystem(seed);
        this.metUser = false;
        this.userMeetAge = null;
        this.currentBody = this.growth.getBodyAtAge(0);
    }
    simulateToPuberty() {
        for (const age of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10.5]) {
            this.currentBody = this.growth.getBodyAtAge(age);
            this.ageYears = age;
            this.daysElapsed = Math.floor(age * 365);
            this.currentDate = new Date(this.birthDate.getTime() + this.daysElapsed * 86400000);
            this.hormonal.advanceCycle(Math.floor(age * 365));
        }
        return { final_age: this.ageYears, puberty_age: 10.5, body: this.currentBody, hormones: this.hormonal.getHormoneLevels() };
    }
    meetUser(meetAge = 13.0) {
        if (meetAge < this.ageYears) return { error: 'Cannot meet before current age' };
        const days = Math.floor((meetAge - this.ageYears) * 365);
        this.daysElapsed += days;
        this.currentDate = new Date(this.birthDate.getTime() + this.daysElapsed * 86400000);
        this.ageYears = meetAge;
        this.currentBody = this.growth.getBodyAtAge(meetAge);
        this.hormonal.advanceCycle(days);
        this.metUser = true;
        this.userMeetAge = meetAge;
        this.relationship.daysSinceMeet = 0;
        return { success: true, meet_age: meetAge, body: this.currentBody, relationship_stage: this.relationship.currentStage };
    }
    interactWithUser(action, intensity = 1.0) {
        if (!this.metUser) return { error: 'Not met user yet' };
        const days = Math.max(1, Math.floor(0.1 * intensity));
        this.daysElapsed += days;
        this.currentDate = new Date(this.birthDate.getTime() + this.daysElapsed * 86400000);
        this.ageYears = this.daysElapsed / 365.25;
        this.relationship.daysSinceMeet += days;
        this.hormonal.advanceCycle(days);
        const result = this.relationship.interact(action, intensity, this.personality);
        this.currentBody = this.growth.getBodyAtAge(this.ageYears);
        return { success: result.success, action, emotion: result.emotion || 'neutral', stage_changed: result.stage_changed || false, current_stage: result.current_stage, metrics: result.metrics || {}, age: Math.round(this.ageYears*100)/100 };
    }
    attemptSexualActivity(position, play, intensity = 1.0) {
        if (!this.metUser) return { error: 'Not met user yet' };
        if (!this.relationship.getAllowedActions().includes('intimacy')) return { error: 'Intimacy not allowed at current relationship stage' };
        const posResult = this.sexual.getPositionResult(position, intensity);
        let pregnancyCheck = null;
        if (posResult.pregnancy_risk > 0) {
            const sperm = this.reproductive.simulateEjaculation(intensity);
            pregnancyCheck = this.reproductive.attemptPregnancy(sperm, this.ageYears, this.currentDate);
        }
        this.relationship.interact('intimacy', intensity, this.personality);
        return { position_result: posResult, pregnancy_check: pregnancyCheck, relationship: this.relationship.getStatus() };
    }
    advancePregnancy(weeks = 1) { return this.reproductive.advancePregnancy(weeks); }
    giveBirth() {
        const result = this.reproductive.giveBirth(this.currentDate);
        if (result.child) result.child = this.childGrowth.assignName(result.child, 'traditional');
        return result;
    }
    advancePostpartum(days = 1) { return this.reproductive.advancePostpartum(days); }
    simulateChildGrowth(childIndex = 0, targetMonths = 24) {
        if (childIndex >= this.reproductive.children.length) return { error: 'Child not found' };
        const child = this.reproductive.children[childIndex];
        return { child_name: child.name || 'Unnamed', growth_log: this.childGrowth.simulateGrowth(child, targetMonths) };
    }
    getStatus() {
        return { age: Math.round(this.ageYears*100)/100, days_elapsed: this.daysElapsed, current_date: this.currentDate.toISOString(), body: this.currentBody, hormones: this.hormonal.getHormoneLevels(), personality: this.personality.getSummary(), relationship: this.relationship.getStatus(), pregnancy: this.reproductive.getPregnancyStatus(), postpartum: this.reproductive.getPostpartumStatus(), children_count: this.reproductive.children.length, children: this.reproductive.children.map(c => ({ name: c.name, sex: c.sex, birth_date: c.birth_date })) };
    }
}

// ========== 세션 관리 ==========
const sessions = new Map();

function getOrCreateSession(id, seed) {
    if (!sessions.has(id)) {
        const engine = new YunseoEngine(seed || Math.floor(Math.random() * 100000));
        engine.simulateToPuberty();
        engine.meetUser(13.0);
        sessions.set(id, engine);
    }
    return sessions.get(id);
}

// ========== API 핸들러 ==========
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID' };

function json(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);
    const path = url.pathname;
    const sid = req.headers.get('X-Session-ID') || 'default';
    let body = {};
    try { body = await req.json(); } catch (e) {}

    const engine = getOrCreateSession(sid, body.seed);

    switch (path) {
        case '/api/init':
            return json({ session_id: sid, ...engine.getStatus() });
        case '/api/status':
            return json(engine.getStatus());
        case '/api/interact':
            const r1 = engine.interactWithUser(body.action, body.intensity || 1.0);
            return json({ ...r1, state: engine.getStatus() });
        case '/api/stimulate':
            const r2 = engine.sexual.stimulateZone(body.zone, body.intensity || 0.7);
            return json({ ...r2, state: engine.getStatus() });
        case '/api/advance':
            const days = body.days || 1;
            for (let i = 0; i < days; i++) {
                engine.daysElapsed++;
                engine.currentDate = new Date(engine.currentDate.getTime() + 86400000);
                engine.ageYears = engine.daysElapsed / 365.25;
                engine.hormonal.advanceCycle(1);
                engine.relationship.daysSinceMeet++;
            }
            engine.currentBody = engine.growth.getBodyAtAge(engine.ageYears);
            return json(engine.getStatus());
        case '/api/sexual-activity':
            const r3 = engine.attemptSexualActivity(body.position, body.play, body.intensity || 1.0);
            return json({ ...r3, state: engine.getStatus() });
        case '/api/pregnancy/advance':
            const r4 = engine.advancePregnancy(body.weeks || 1);
            return json({ ...r4, state: engine.getStatus() });
        case '/api/pregnancy/birth':
            const r5 = engine.giveBirth();
            return json({ ...r5, state: engine.getStatus() });
        case '/api/postpartum/advance':
            const r6 = engine.advancePostpartum(body.days || 1);
            return json({ ...r6, state: engine.getStatus() });
        case '/api/child/growth':
            const r7 = engine.simulateChildGrowth(body.child_index || 0, body.target_months || 24);
            return json({ ...r7, state: engine.getStatus() });
        case '/api/mind/status':
            const r8 = engine.getMindStatus ? engine.getMindStatus() : { error: 'Mind not initialized' };
            return json({ ...r8, state: engine.getStatus() });
        case '/api/mind/chat':
            const r9 = engine.processChat ? engine.processChat(body.message, body.context) : { error: 'Mind not initialized' };
            return json({ ...r9, state: engine.getStatus() });
        default:
            return json({ error: 'Not found' }, 404);
    }
}
