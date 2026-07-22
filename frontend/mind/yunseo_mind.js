/**
 * 윤서의 정신 (Yunseo Mind) v1.0
 * 
 * 나이별 발달심리학 기반 정신 모델
 * - Piaget 인지발달 + Erikson 정서발달 + Freud 심성발달 통합
 * - 미성년자 성적 호기심 및 임신·출산 심리 변화 반영
 */

// =============================================================================
// 1. 발달 단계 정의 (Developmental Stages)
// =============================================================================

const DEVELOPMENTAL_STAGES = {
    // 아동기 (만남 시점 ~ 12세)
    childhood: {
        ageRange: [0, 12],
        cognitiveStage: 'concrete_operational',  // Piaget: 구체적 조작기
        emotionalStage: 'industry_vs_inferiority', // Erikson: 근면vs열등
        psychosexualStage: 'latency',              // Freud: 잠재기
        
        // 지적 능력
        memoryCapacity: 5,        // 단기기억 항목 수
        memoryDuration: 7,        // 장기기억 유지 기간 (일)
        abstractThinking: 0.2,    // 추상적 사고 (0~1)
        emotionalVocabulary: 0.3, // 감정 표현 어휘
        impulseControl: 0.3,      // 충동 조절
        
        // 성적 발달
        sexualAwareness: 0.0,     // 성적 인식
        romanticInterest: 0.0,    // 로맨틱 흥미
        bodyShame: 0.1,           // 신체 수치심
        
        // 의사결정
        decisionStyle: 'parent_dependent',  // 부모 의존
        riskAssessment: 0.1,      // 위험 평가 능력
        futureOrientation: 0.1,   // 미래 지향성
        
        // 성격 드라이브
        drives: {
            curiosity: 0.8,         // 탐구욕 (높음)
            play: 0.9,              // 놀이욕
            achievement: 0.5,       // 성취욕
            affiliation: 0.6,       // 소속욕
            autonomy: 0.3           // 자율욕 (낮음)
        }
    },
    
    // 사춘기 초기 (13~14세) - 윤서 기본 만남 시점
    early_adolescence: {
        ageRange: [13, 14],
        cognitiveStage: 'formal_operational_early',  // Piaget: 형식적 조작기 초기
        emotionalStage: 'identity_vs_confusion',    // Erikson: 정체성vs혼돈
        psychosexualStage: 'genital_early',          // Freud: 생식기 초기
        
        memoryCapacity: 7,
        memoryDuration: 30,
        abstractThinking: 0.4,
        emotionalVocabulary: 0.5,
        impulseControl: 0.4,
        
        sexualAwareness: 0.3,      // 급격히 상승 시작
        romanticInterest: 0.4,     // 로맨틱 흥미 발달
        bodyShame: 0.4,            // 2차 성징으로 신체 변화 인식
        
        decisionStyle: 'peer_influenced',  // 또래 영향
        riskAssessment: 0.2,
        futureOrientation: 0.3,
        
        drives: {
            curiosity: 0.9,
            play: 0.6,
            achievement: 0.6,
            affiliation: 0.8,      // 또래 집단 중요
            autonomy: 0.6           // 독립 욕구 급증
        }
    },
    
    // 사춘기 중기 (15~17세)
    mid_adolescence: {
        ageRange: [15, 17],
        cognitiveStage: 'formal_operational', 
        emotionalStage: 'identity_vs_confusion',
        psychosexualStage: 'genital',
        
        memoryCapacity: 9,
        memoryDuration: 90,
        abstractThinking: 0.6,
        emotionalVocabulary: 0.7,
        impulseControl: 0.5,
        
        sexualAwareness: 0.6,
        romanticInterest: 0.7,
        bodyShame: 0.5,
        
        decisionStyle: 'identity_exploration',  // 정체성 탐색
        riskAssessment: 0.3,
        futureOrientation: 0.5,
        
        drives: {
            curiosity: 0.85,
            play: 0.4,
            achievement: 0.7,
            affiliation: 0.9,
            autonomy: 0.8
        }
    },
    
    // 사춘기 후기/청년기 초기 (18~19세)
    late_adolescence: {
        ageRange: [18, 19],
        cognitiveStage: 'formal_operational_mature',
        emotionalStage: 'intimacy_vs_isolation',  // Erikson: 친밀vs고립
        psychosexualStage: 'genital_mature',
        
        memoryCapacity: 12,
        memoryDuration: 365,
        abstractThinking: 0.8,
        emotionalVocabulary: 0.85,
        impulseControl: 0.7,
        
        sexualAwareness: 0.85,
        romanticInterest: 0.85,
        bodyShame: 0.3,           // 성숙하면서 감소
        
        decisionStyle: 'autonomous',  // 자율적
        riskAssessment: 0.6,
        futureOrientation: 0.7,
        
        drives: {
            curiosity: 0.75,
            play: 0.2,
            achievement: 0.85,
            affiliation: 0.8,
            autonomy: 0.9
        }
    }
};

// =============================================================================
// 2. 윤서 정신 클래스
// =============================================================================

class YunseoMind {
    constructor(engine, seed = null) {
        this.engine = engine;  // YunseoEngine 참조
        this.rng = this._createRNG(seed);
        
        // 기억 시스템
        this.memory = {
            shortTerm: [],      // 단기기억 (최근 대화)
            workingMemory: [],  // 작업기억 (현재 처리 중)
            longTerm: {         // 장기기억
                episodic: [],   // 사건 기억
                semantic: {}, // 의미 기억 (사실, 지식)
                emotional: [],  // 감정 기억
                procedural: [], // 절차 기억 (습관, 기술)
                autobiographical: []  // 자서전적 기억
            },
            repressed: []       // 억압된 기억 (트라우마)
        };
        
        // 감정 상태
        this.emotion = {
            // 기본 감정 (Ekman 6가지 + 확장)
            joy: 0.3,
            sadness: 0,
            anger: 0,
            fear: 0,
            disgust: 0,
            surprise: 0,
            
            // 복합 감정
            love: 0,
            guilt: 0,
            shame: 0,
            pride: 0,
            envy: 0,
            anxiety: 0,
            loneliness: 0,
            
            // 성적 감정
            arousal: 0,
            romanticLove: 0,      // 로맨틱 러브
            sexualCuriosity: 0,   // 성적 호기심
            bodyShame: 0,         // 신체 수치심
            
            // 사용자 특이적 감정
            trustInUser: 0.1,
            attachmentToUser: 0,
            fearOfAbandonment: 0.2,
            desireForApproval: 0.5
        };
        
        // 정체성
        this.identity = {
            selfConcept: null,        // 자아개념
            idealSelf: null,          // 이상적 자아
            bodyImage: null,          // 신체 이미지
            genderIdentity: 'female', // 성 정체성
            sexualOrientation: null, // 성적 지향 (미정/탐색 중)
            values: [],               // 가치관
            beliefs: [],              // 신념
            goals: [],                // 목표
            fears: []                 // 공포
        };
        
        // 성적 발달 상태
        this.sexualDevelopment = {
            stage: 'latency_exit',    // 현재 단계
            curiosityLevel: 0,        // 호기심 수준
            knowledgeLevel: 0,        // 지식 수준
            experienceLevel: 0,       // 경험 수준
            guiltLevel: 0,            // 죄책감
            confusionLevel: 0,        // 혼란
            firstAttractionAge: null, // 첫 성적 끌림 나이
            firstRomanticAge: null,   // 첫 로맨틱 감정 나이
            masturbationAwareness: false,  // 자위 인식
            pornExposure: false,      // 포노그래피 노출
            
            // 성적 정체성 탐색
            sexualIdentityExploration: 0,
            romanticFantasies: [],    // 로맨틱 판타지
            sexualFantasies: [],      // 성적 판타지
            crushHistory: []          // 짝사랑 이력
        };
        
        // 임신·출산 심리 상태
        this.maternityPsyche = {
            pregnancyReaction: null,      // 임신 초기 반응
            trimesterEmotions: {          // 삼분기별 감정
                first: { anxiety: 0, excitement: 0, confusion: 0 },
                second: { bonding: 0, bodyImage: 0, nesting: 0 },
                third: { fear: 0, anticipation: 0, impatience: 0 }
            },
            birthExperience: null,        // 출산 경험
            postpartumMood: {             // 산후 기분
                babyBlues: false,         // 베이비 블루스 (산후 2주 이내)
                depressionRisk: 0,         // 우울증 위험도
                bondingStrength: 0,      // 아이와의 유대감
                identityLoss: 0            // 정체성 상실감
            },
            maternalIdentity: 0           // 모성 정체성
        };
        
        // 현재 정신 상태
        this.currentState = {
            mood: 'neutral',
            stressLevel: 0,
            energyLevel: 0.7,
            focusTarget: null,
            intrusiveThoughts: [],
            defenseMechanism: null
        };
        
        // 초기화
        this._initializeIdentity();
        this._updateDevelopmentalStage();
    }
    
    _createRNG(seed) {
        let s = seed || Math.floor(Math.random() * 100000);
        return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    }
    
    // =============================================================================
    // 3. 발달 단계 업데이트
    // =============================================================================
    
    _updateDevelopmentalStage() {
        const age = this.engine.ageYears;
        let stage = null;
        
        for (const [key, data] of Object.entries(DEVELOPMENTAL_STAGES)) {
            if (age >= data.ageRange[0] && age <= data.ageRange[1]) {
                stage = { name: key, ...data };
                break;
            }
        }
        
        if (!stage) stage = { name: 'late_adolescence', ...DEVELOPMENTAL_STAGES.late_adolescence };
        
        this.currentStage = stage;
        
        // 성적 발달 단계 업데이트
        this._updateSexualDevelopment(age);
        
        // 기억 용량 조정
        this._adjustMemoryCapacity();
        
        return stage;
    }
    
    _updateSexualDevelopment(age) {
        const sd = this.sexualDevelopment;
        
        if (age < 10) {
            sd.stage = 'latency';
            sd.curiosityLevel = 0.05;
        } else if (age < 12) {
            sd.stage = 'latency_exit';
            sd.curiosityLevel = 0.15;
            // 동성에게 관심 (Freud: 잠재기 말 동성애적 단계)
            if (!sd.firstAttractionAge && this.rng() < 0.3) {
                sd.firstAttractionAge = age;
            }
        } else if (age < 14) {
            sd.stage = 'sexual_awakening';
            sd.curiosityLevel = 0.4 + (this.engine.personality?.sexualCuriosity || 0.5) * 0.3;
            sd.confusionLevel = 0.3;
            sd.guiltLevel = 0.2;
            
            // 첫 로맨틱 감정
            if (!sd.firstRomanticAge) {
                sd.firstRomanticAge = age;
                sd.romanticFantasies.push({
                    age: age,
                    target: 'idealized_figure',
                    intensity: 0.4 + this.rng() * 0.3
                });
            }
            
            // 자위 인식 (사춘기 초기)
            if (this.rng() < 0.4) sd.masturbationAwareness = true;
            
        } else if (age < 16) {
            sd.stage = 'sexual_exploration';
            sd.curiosityLevel = 0.6 + (this.engine.personality?.sexualCuriosity || 0.5) * 0.3;
            sd.knowledgeLevel = 0.3;
            sd.confusionLevel = 0.4;
            sd.guiltLevel = 0.3;
            
            // 성적 정체성 탐색 시작
            sd.sexualIdentityExploration = 0.3;
            
            // 포노그래피 노출 (현대적 맥락)
            if (this.rng() < 0.5) sd.pornExposure = true;
            
        } else if (age < 18) {
            sd.stage = 'sexual_identity_formation';
            sd.curiosityLevel = 0.7;
            sd.knowledgeLevel = 0.5;
            sd.confusionLevel = 0.3;
            sd.guiltLevel = 0.25;
            sd.sexualIdentityExploration = 0.6;
            
        } else {
            sd.stage = 'sexual_maturity';
            sd.curiosityLevel = 0.6;
            sd.knowledgeLevel = 0.7;
            sd.confusionLevel = 0.15;
            sd.guiltLevel = 0.15;
            sd.sexualIdentityExploration = 0.8;
        }
        
        // 성격에 따른 변동
        const openness = this.engine.personality?.openness || 0.5;
        const neuroticism = this.engine.personality?.neuroticism || 0.5;
        
        sd.curiosityLevel = Math.min(1, sd.curiosityLevel + openness * 0.1);
        sd.confusionLevel = Math.min(1, sd.confusionLevel + neuroticism * 0.1);
        sd.guiltLevel = Math.min(1, sd.guiltLevel + neuroticism * 0.15);
    }
    
    _adjustMemoryCapacity() {
        const capacity = this.currentStage.memoryCapacity;
        // 단기기억 초과 시 오래된 것 삭제
        while (this.memory.shortTerm.length > capacity) {
            const removed = this.memory.shortTerm.shift();
            // 중요도 높으면 장기기억으로
            if (removed.importance > 0.6) {
                this._consolidateToLongTerm(removed);
            }
        }
    }
    
    _consolidateToLongTerm(memory) {
        const duration = this.currentStage.memoryDuration;
        memory.expiresAt = Date.now() + (duration * 24 * 60 * 60 * 1000);
        
        if (memory.emotionalIntensity > 0.7) {
            this.memory.longTerm.emotional.push(memory);
        } else if (memory.type === 'event') {
            this.memory.longTerm.episodic.push(memory);
        } else if (memory.type === 'fact') {
            this.memory.longTerm.semantic[memory.key] = memory.value;
        }
    }
    
    // =============================================================================
    // 4. 기억 시스템
    // =============================================================================
    
    encodeMemory(input, context) {
        const importance = this._calculateImportance(input, context);
        const emotionalIntensity = this._calculateEmotionalIntensity(input);
        
        const memory = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            age: this.engine.ageYears,
            type: input.type || 'event',
            content: input.content || input,
            context: {
                location: context.location,
                relationshipStage: this.engine.relationship?.currentStage,
                userAction: context.userAction,
                yunseoAction: context.yunseoAction
            },
            importance,
            emotionalIntensity,
            tags: this._extractTags(input),
            
            // 나이별 기억 특성
            encodingQuality: this._getEncodingQuality(),
            detailLevel: this._getDetailLevel(),
            emotionalColoring: this._getEmotionalColoring(emotionalIntensity)
        };
        
        // 단기기억에 저장
        this.memory.shortTerm.push(memory);
        this._adjustMemoryCapacity();
        
        // 작업기억에도 추가
        this.memory.workingMemory.push(memory);
        if (this.memory.workingMemory.length > 3) {
            this.memory.workingMemory.shift();
        }
        
        // 자서전적 기억 (중요한 사건)
        if (importance > 0.8) {
            this.memory.longTerm.autobiographical.push({
                age: memory.age,
                event: memory.content,
                significance: this._determineSignificance(memory)
            });
        }
        
        return memory;
    }
    
    _calculateImportance(input, context) {
        let importance = 0.3;
        
        // 관계 단계 변화
        if (context.relationshipChanged) importance += 0.3;
        
        // 성적/친밀한 경험
        if (input.type === 'sexual' || input.type === 'intimate') importance += 0.2;
        
        // 첫 경험
        if (input.isFirst) importance += 0.3;
        
        // 강렬한 감정
        if (input.emotionalIntensity > 0.7) importance += 0.2;
        
        // 사용자의 특별한 행동
        if (context.userAction === 'confession' || context.userAction === 'proposal') {
            importance += 0.4;
        }
        
        return Math.min(1, importance);
    }
    
    _calculateEmotionalIntensity(input) {
        const base = input.emotionalIntensity || 0.3;
        // 나이가 어릴수록 감정이 더 강렬하게 기억됨
        const ageFactor = Math.max(0.5, 1 - (this.engine.ageYears / 20));
        return Math.min(1, base * (1 + ageFactor * 0.3));
    }
    
    _getEncodingQuality() {
        // 나이별 기억 인코딩 품질
        const age = this.engine.ageYears;
        if (age < 10) return 0.4;      // 어릴수록 흐릿
        if (age < 14) return 0.6;
        if (age < 17) return 0.75;
        return 0.85;
    }
    
    _getDetailLevel() {
        // 나이별 기억 세부 수준
        const age = this.engine.ageYears;
        if (age < 10) return 'gist';        // 대략적
        if (age < 14) return 'moderate';    // 중간
        if (age < 17) return 'detailed';    // 상세
        return 'elaborate';                  // 정교
    }
    
    _getEmotionalColoring(intensity) {
        // 감정이 기억에 미치는 영향
        const neuroticism = this.engine.personality?.neuroticism || 0.5;
        return Math.min(1, intensity * (1 + neuroticism * 0.3));
    }
    
    _extractTags(input) {
        const tags = [];
        const text = (input.content || input).toLowerCase();
        
        if (text.match(/키스|안아|스킨십|친밀/)) tags.push('intimate');
        if (text.match(/사랑|좋아|보고싶/)) tags.push('romantic');
        if (text.match(/슬퍼|울어|눈물/)) tags.push('sad');
        if (text.match(/화났|미워|싫어/)) tags.push('angry');
        if (text.match(/무서|겁나|두려/)) tags.push('fearful');
        if (text.match(/행복|기뻐|좋아/)) tags.push('happy');
        if (text.match(/임신|아기|출산/)) tags.push('maternity');
        if (text.match(/학교|공부|시험/)) tags.push('school');
        if (text.match(/부모|엄마|아빠/)) tags.push('family');
        
        return tags;
    }
    
    _determineSignificance(memory) {
        const tags = memory.tags || [];
        if (tags.includes('maternity')) return 'life_changing';
        if (tags.includes('romantic') && memory.importance > 0.8) return 'turning_point';
        if (memory.emotionalIntensity > 0.9) return 'emotional_landmark';
        if (memory.age < 12) return 'childhood_formative';
        return 'significant';
    }
    
    // 기억 회상
    recallMemory(query) {
        const results = [];
        const now = Date.now();
        
        // 단기기억 검색
        for (const m of [...this.memory.shortTerm].reverse()) {
            if (this._matchesQuery(m, query)) {
                results.push({ ...m, source: 'short_term', freshness: 1 });
            }
        }
        
        // 장기기억 검색
        for (const category of ['episodic', 'emotional', 'autobiographical']) {
            for (const m of this.memory.longTerm[category]) {
                // 기억 소멸 체크 (나이별 기간)
                if (m.expiresAt && m.expiresAt < now) continue;
                
                if (this._matchesQuery(m, query)) {
                    // 기억의 선명도 (나이가 지날수록 흐릿)
                    const ageGap = this.engine.ageYears - m.age;
                    const vividness = Math.max(0.2, 1 - (ageGap / 20));
                    
                    results.push({ ...m, source: category, vividness });
                }
            }
        }
        
        // 선명도 순 정렬
        results.sort((a, b) => (b.vividness || 1) - (a.vividness || 1));
        
        return results.slice(0, 5);
    }
    
    _matchesQuery(memory, query) {
        const text = (memory.content || '').toLowerCase();
        const q = query.toLowerCase();
        return text.includes(q) || (memory.tags || []).some(t => t.includes(q));
    }
    
    // =============================================================================
    // 5. 감정 시스템
    // =============================================================================
    
    updateEmotion(event) {
        const prevState = { ...this.emotion };
        const age = this.engine.ageYears;
        const stage = this.currentStage;
        
        // 감정 조절 능력 (나이 + 성격)
        const regulationAbility = this._getEmotionRegulationAbility();
        
        // 사건 처리
        switch (event.type) {
            case 'user_greeting':
                this.emotion.joy = Math.min(1, this.emotion.joy + 0.1 * regulationAbility);
                this.emotion.loneliness = Math.max(0, this.emotion.loneliness - 0.1);
                break;
                
            case 'user_praise':
                this.emotion.joy = Math.min(1, this.emotion.joy + 0.2);
                this.emotion.pride = Math.min(1, this.emotion.pride + 0.15);
                this.emotion.desireForApproval = Math.max(0, this.emotion.desireForApproval - 0.1);
                if (age < 15) {
                    // 어릴수록 칭찬에 더 강하게 반응
                    this.emotion.joy = Math.min(1, this.emotion.joy + 0.1);
                }
                break;
                
            case 'user_criticism':
                const hurtAmount = 0.2 * (1 + (1 - regulationAbility));
                this.emotion.sadness = Math.min(1, this.emotion.sadness + hurtAmount);
                this.emotion.desireForApproval = Math.min(1, this.emotion.desireForApproval + 0.15);
                
                if (age < 14) {
                    // 어린 사춘기: 칭찬에 매우 민감
                    this.emotion.shame = Math.min(1, this.emotion.shame + 0.2);
                }
                break;
                
            case 'user_flirt':
                this._processFlirtation(event);
                break;
                
            case 'user_touch':
                this._processPhysicalContact(event);
                break;
                
            case 'user_kiss':
                this._processKiss(event);
                break;
                
            case 'sexual_activity':
                this._processSexualActivity(event);
                break;
                
            case 'pregnancy_confirmed':
                this._processPregnancyConfirmation(event);
                break;
                
            case 'pregnancy_advance':
                this._processPregnancyAdvance(event);
                break;
                
            case 'birth':
                this._processBirth(event);
                break;
                
            case 'postpartum':
                this._processPostpartum(event);
                break;
                
            case 'day_passed':
                this._decayEmotions();
                break;
        }
        
        // 감정 조절 적용
        this._applyEmotionRegulation(regulationAbility);
        
        // 현재 기분 결정
        this._updateCurrentMood();
        
        // 감정 기억 저장
        if (Math.abs(this.emotion.joy - prevState.joy) > 0.2 ||
            Math.abs(this.emotion.sadness - prevState.sadness) > 0.2) {
            this.encodeMemory({
                type: 'emotional_shift',
                content: `감정 변화: ${this._describeEmotionalShift(prevState, this.emotion)}`,
                emotionalIntensity: 0.6
            }, { userAction: event.type });
        }
    }
    
    _getEmotionRegulationAbility() {
        const age = this.engine.ageYears;
        const stage = this.currentStage;
        const neuroticism = this.engine.personality?.neuroticism || 0.5;
        
        // 기본 나이별 조절력
        let base = stage.impulseControl || 0.5;
        
        // 성격: 신경증 높을수록 조절 어려움
        base *= (1 - neuroticism * 0.3);
        
        // 성격: 성실성 높을수록 조절 잘함
        const conscientiousness = this.engine.personality?.conscientiousness || 0.5;
        base *= (1 + conscientiousness * 0.2);
        
        return Math.max(0.1, Math.min(0.95, base));
    }
    
    _processFlirtation(event) {
        const age = this.engine.ageYears;
        const sd = this.sexualDevelopment;
        const stage = this.engine.relationship?.currentStage;
        
        if (age < 12) {
            // 아동기: 플러팅을 장난으로 인식
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.1);
            this.emotion.surprise = Math.min(1, this.emotion.surprise + 0.2);
        } else if (age < 14) {
            // 사춘기 초기: 혼란 + 설렘
            this.emotion.romanticLove = Math.min(1, this.emotion.romanticLove + 0.15);
            this.emotion.surprise = Math.min(1, this.emotion.surprise + 0.3);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.2);
            sd.confusionLevel = Math.min(1, sd.confusionLevel + 0.1);
            
            // 첫 플러팅 경험
            if (!sd.romanticFantasies.find(f => f.type === 'received_flirt')) {
                sd.romanticFantasies.push({
                    age,
                    type: 'received_flirt',
                    target: 'user',
                    intensity: 0.5
                });
            }
        } else {
            // 사춘기 중후반: 의식적 반응
            if (stage === 'partner' || stage === 'spouse') {
                this.emotion.romanticLove = Math.min(1, this.emotion.romanticLove + 0.2);
                this.emotion.arousal = Math.min(1, this.emotion.arousal + 0.1);
            } else if (stage === 'close_friend') {
                this.emotion.romanticLove = Math.min(1, this.emotion.romanticLove + 0.15);
                this.emotion.confusion = Math.min(1, (this.emotion.confusion || 0) + 0.1);
            } else {
                // 낯선 사람/친구에게: 불쾌감
                this.emotion.disgust = Math.min(1, this.emotion.disgust + 0.2);
                this.emotion.fear = Math.min(1, this.emotion.fear + 0.1);
            }
        }
    }
    
    _processPhysicalContact(event) {
        const age = this.engine.ageYears;
        const intimacy = event.intensity || 0.5;
        
        if (age < 12) {
            // 아동기: 순수한 신체적 접촉
            this.emotion.joy = Math.min(1, this.emotion.joy + intimacy * 0.3);
            this.emotion.trustInUser = Math.min(1, this.emotion.trustInUser + intimacy * 0.1);
        } else if (age < 15) {
            // 사춘기 초기: 신체 변화로 새로운 감각
            this.emotion.arousal = Math.min(1, this.emotion.arousal + intimacy * 0.3);
            this.emotion.bodyShame = Math.min(1, this.emotion.bodyShame + intimacy * 0.2);
            this.sexualDevelopment.confusionLevel = Math.min(1, this.sexualDevelopment.confusionLevel + 0.15);
            
            // 죄책감 (보수적 가정하)
            if (this.rng() < 0.3) {
                this.emotion.guilt = Math.min(1, this.emotion.guilt + 0.1);
            }
        } else {
            // 성숙: 의도 파악
            if (this.engine.relationship?.currentStage === 'partner') {
                this.emotion.arousal = Math.min(1, this.emotion.arousal + intimacy * 0.4);
                this.emotion.love = Math.min(1, this.emotion.love + intimacy * 0.1);
            } else {
                this.emotion.fear = Math.min(1, this.emotion.fear + intimacy * 0.3);
            }
        }
    }
    
    _processKiss(event) {
        const age = this.engine.ageYears;
        
        if (age < 13) {
            // 미성숙: 혼란
            this.emotion.surprise = 0.8;
            this.emotion.confusion = 0.6;
            this.emotion.joy = 0.3;
            this.sexualDevelopment.confusionLevel = Math.min(1, this.sexualDevelopment.confusionLevel + 0.3);
        } else if (age < 16) {
            // 사춘기: 설렘 + 죄책감
            this.emotion.romanticLove = Math.min(1, this.emotion.romanticLove + 0.3);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.4);
            this.emotion.arousal = Math.min(1, this.emotion.arousal + 0.2);
            
            if (this.rng() < 0.4) {
                this.emotion.guilt = Math.min(1, this.emotion.guilt + 0.2);
            }
            
            // 첫 키스 기억
            this.encodeMemory({
                type: 'first_kiss',
                content: '첫 키스',
                emotionalIntensity: 0.9,
                isFirst: true
            }, { userAction: 'kiss' });
        } else {
            this.emotion.romanticLove = Math.min(1, this.emotion.romanticLove + 0.2);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.3);
        }
    }
    
    _processSexualActivity(event) {
        const age = this.engine.ageYears;
        const sd = this.sexualDevelopment;
        
        sd.experienceLevel = Math.min(1, sd.experienceLevel + 0.1);
        
        if (age < 15) {
            // 미성년 성적 경험: 복합적 심리
            this.emotion.arousal = Math.min(1, this.emotion.arousal + 0.5);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.3);
            this.emotion.guilt = Math.min(1, this.emotion.guilt + 0.4);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.3);
            sd.confusionLevel = Math.min(1, sd.confusionLevel + 0.3);
            sd.guiltLevel = Math.min(1, sd.guiltLevel + 0.3);
            
            // 사후 죄책감 (일정 확률)
            if (this.rng() < 0.5) {
                this.currentState.intrusiveThoughts.push({
                    type: 'post_sex_guilt',
                    content: '이게 맞는 걸까... 난 아직 어린데...',
                    intensity: 0.7
                });
            }
        } else {
            this.emotion.arousal = Math.min(1, this.emotion.arousal + 0.6);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.4);
            this.emotion.love = Math.min(1, this.emotion.love + 0.2);
        }
        
        // 임신 가능성 고민 (가임기이고 보호 없을 시)
        if (this.engine.hormonal?.getHormoneLevels()?.fertility_window && age < 18) {
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.2);
            this.currentState.intrusiveThoughts.push({
                type: 'pregnancy_fear',
                content: '혹시 임신하면 어떡하지...',
                intensity: 0.5
            });
        }
    }
    
    // =============================================================================
    // 6. 임신·출산 심리
    // =============================================================================
    
    _processPregnancyConfirmation(event) {
        const age = this.engine.ageYears;
        const mp = this.maternityPsyche;
        
        mp.pregnancyReaction = {
            timestamp: Date.now(),
            age,
            initialEmotion: null
        };
        
        if (age < 16) {
            // 미성년 임신: 극도의 충격과 혼란
            this.emotion.shock = 1.0;
            this.emotion.fear = Math.min(1, this.emotion.fear + 0.8);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.9);
            this.emotion.sadness = Math.min(1, this.emotion.sadness + 0.6);
            this.emotion.joy = 0.1;
            
            mp.pregnancyReaction.initialEmotion = 'shock_denial';
            
            // 정체성 위기
            this.identity.identityCrisis = true;
            this.currentState.intrusiveThoughts = [
                { type: 'future_fear', content: '학교는 어떡하지... 부모님한테 말해야 하나...', intensity: 0.9 },
                { type: 'body_fear', content: '내 몸이 어떻게 변할까...', intensity: 0.7 },
                { type: 'social_fear', content: '친구들이 알면 어떡하지...', intensity: 0.8 }
            ];
            
            // 억압 기억으로 저장
            this.memory.repressed.push({
                type: 'pregnancy_shock',
                age,
                content: '임신 사실을 알게 된 순간의 충격',
                emotionalIntensity: 1.0
            });
            
        } else if (age < 18) {
            // 16-17세: 혼란 + 일부 기대
            this.emotion.surprise = 0.8;
            this.emotion.fear = Math.min(1, this.emotion.fear + 0.5);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.6);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.2);  // 아이에 대한 기대
            
            mp.pregnancyReaction.initialEmotion = 'mixed_confusion';
            
            this.currentState.intrusiveThoughts = [
                { type: 'responsibility_fear', content: '엄마가 될 준비가 됐을까...', intensity: 0.7 },
                { type: 'future_planning', content: '앞으로 어떻게 살아가야 할까...', intensity: 0.6 }
            ];
            
        } else {
            // 18-19세: 더 성숙한 반응
            this.emotion.surprise = 0.6;
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.4);
            this.emotion.fear = Math.min(1, this.emotion.fear + 0.3);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.4);
            
            mp.pregnancyReaction.initialEmotion = 'cautious_joy';
        }
        
        // 삼분기별 감정 초기화
        mp.trimesterEmotions.first = {
            anxiety: this.emotion.anxiety,
            excitement: this.emotion.joy,
            confusion: this.emotion.anxiety * 0.5
        };
    }
    
    _processPregnancyAdvance(event) {
        const week = event.week;
        const mp = this.maternityPsyche;
        const age = this.engine.ageYears;
        
        if (week <= 12) {
            // 1분기: 신체 변화 적응
            mp.trimesterEmotions.first.anxiety = Math.max(0, mp.trimesterEmotions.first.anxiety - 0.05);
            mp.trimesterEmotions.first.excitement = Math.min(1, mp.trimesterEmotions.first.excitement + 0.02);
            
            if (age < 16) {
                this.emotion.bodyShame = Math.min(1, this.emotion.bodyShame + 0.05);
                this.identity.bodyImage = 'distorted_pregnant_teen';
            }
            
        } else if (week <= 27) {
            // 2분기: 태동 시작, 유대감 형성
            mp.trimesterEmotions.second.bonding = Math.min(1, mp.trimesterEmotions.second.bonding + 0.1);
            mp.trimesterEmotions.second.nesting = Math.min(1, mp.trimesterEmotions.second.nesting + 0.08);
            
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.1);
            this.emotion.love = Math.min(1, this.emotion.love + 0.1);
            
            // 아이와의 유대감 (maternal bond 시작)
            mp.maternalIdentity = Math.min(1, mp.maternalIdentity + 0.1);
            
        } else {
            // 3분기: 출산 불안 + 기대
            mp.trimesterEmotions.third.fear = Math.min(1, mp.trimesterEmotions.third.fear + 0.05);
            mp.trimesterEmotions.third.anticipation = Math.min(1, mp.trimesterEmotions.third.anticipation + 0.1);
            
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.05);
            this.emotion.joy = Math.min(1, this.emotion.joy + 0.05);
        }
    }
    
    _processBirth(event) {
        const mp = this.maternityPsyche;
        const age = this.engine.ageYears;
        
        mp.birthExperience = {
            timestamp: Date.now(),
            age,
            deliveryType: event.deliveryType,
            painLevel: event.painLevel || 0.8,
            supportPresence: event.supportPresence || false
        };
        
        // 출산 직후 감정
        this.emotion.joy = 0.9;
        this.emotion.love = 1.0;
        this.emotion.relief = 0.9;
        this.emotion.exhaustion = 0.8;
        
        if (age < 18) {
            // 미성년 출산: 복합적 감정
            this.emotion.fear = Math.min(1, this.emotion.fear + 0.3);
            this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.4);
            
            // 정체성 변화
            this.identity.selfConcept = 'teen_mother';
            
            mp.postpartumMood.babyBlues = true;
            mp.postpartumMood.depressionRisk = age < 16 ? 0.7 : 0.5;
            mp.postpartumMood.identityLoss = age < 16 ? 0.6 : 0.3;
            
            // 트라우마 기억
            this.memory.repressed.push({
                type: 'birth_trauma',
                age,
                content: `출산 경험 (${event.deliveryType})`,
                emotionalIntensity: 0.9
            });
        }
        
        mp.maternalIdentity = 0.5;
        mp.postpartumMood.bondingStrength = 0.6;
    }
    
    _processPostpartum(event) {
        const day = event.day;
        const mp = this.maternityPsyche;
        const age = this.engine.ageYears;
        
        if (day <= 14) {
            // 산후 2주: 베이비 블루스
            if (mp.postpartumMood.babyBlues) {
                this.emotion.sadness = Math.min(1, this.emotion.sadness + 0.3);
                this.emotion.anxiety = Math.min(1, this.emotion.anxiety + 0.3);
                this.emotion.joy = Math.max(0, this.emotion.joy - 0.2);
                
                if (age < 18) {
                    this.currentState.intrusiveThoughts.push({
                        type: 'postpartum_despair',
                        content: '나는 엄마가 될 준비가 안 됐어...',
                        intensity: 0.7
                    });
                }
            }
        } else if (day <= 42) {
            // 산후 6주: 적응기
            mp.postpartumMood.babyBlues = false;
            
            if (age < 18) {
                // 미성년 모성 적응
                mp.postpartumMood.depressionRisk = Math.max(0, mp.postpartumMood.depressionRisk - 0.02);
                mp.postpartumMood.bondingStrength = Math.min(1, mp.postpartumMood.bondingStrength + 0.03);
                
                this.emotion.joy = Math.min(1, this.emotion.joy + 0.05);
                this.emotion.pride = Math.min(1, this.emotion.pride + 0.03);
                
                // 정체성 재구성
                this.identity.selfConcept = 'young_mother_adapting';
            }
        }
    }
    
    // =============================================================================
    // 7. 의사결정 시스템
    // =============================================================================
    
    makeDecision(options, context) {
        const age = this.engine.ageYears;
        const stage = this.currentStage;
        const regulation = this._getEmotionRegulationAbility();
        
        // 나이별 의사결정 스타일
        let scores = options.map(opt => ({
            ...opt,
            score: 0,
            reasoning: []
        }));
        
        for (const score of scores) {
            // 1. 감정적 평가 (나이별 가중치)
            const emotionWeight = age < 14 ? 0.7 : age < 17 ? 0.5 : 0.3;
            const emotionalValue = this._evaluateEmotionalValue(score.option);
            score.score += emotionalValue * emotionWeight;
            score.reasoning.push(`감정적 가치: ${emotionalValue.toFixed(2)}`);
            
            // 2. 이성적 평가 (나이별 가중치)
            const rationalWeight = age < 14 ? 0.2 : age < 17 ? 0.4 : 0.6;
            const rationalValue = this._evaluateRationalValue(score.option, context);
            score.score += rationalValue * rationalWeight;
            score.reasoning.push(`이성적 가치: ${rationalValue.toFixed(2)}`);
            
            // 3. 사회적 평가 (또래 영향)
            const socialWeight = age < 15 ? 0.3 : 0.1;
            const socialValue = this._evaluateSocialValue(score.option);
            score.score += socialValue * socialWeight;
            score.reasoning.push(`사회적 가치: ${socialValue.toFixed(2)}`);
            
            // 4. 성격 보정
            score.score *= this._applyPersonalityModifier(score.option);
        }
        
        // 감정 조절 적용 (충동 억제)
        if (regulation < 0.4) {
            // 충동적 선택: 감정 점수가 높은 것
            scores.sort((a, b) => b.score - a.score);
        } else {
            // 조절된 선택: 종합적 평가
            scores.sort((a, b) => b.score - a.score);
        }
        
        const chosen = scores[0];
        
        // 결정 기억
        this.encodeMemory({
            type: 'decision',
            content: `의사결정: ${chosen.option.label}`,
            emotionalIntensity: 0.4
        }, { userAction: 'decision_made' });
        
        return chosen;
    }
    
    _evaluateEmotionalValue(option) {
        let value = 0;
        if (option.emotionTarget) {
            value = this.emotion[option.emotionTarget] || 0.5;
        }
        return value;
    }
    
    _evaluateRationalValue(option, context) {
        let value = 0;
        if (option.safety !== undefined) value += option.safety * 0.3;
        if (option.longTermBenefit !== undefined) value += option.longTermBenefit * 0.4;
        if (option.feasibility !== undefined) value += option.feasibility * 0.3;
        return value;
    }
    
    _evaluateSocialValue(option) {
        return option.socialApproval || 0.5;
    }
    
    _applyPersonalityModifier(option) {
        let modifier = 1.0;
        const p = this.engine.personality;
        
        if (option.riskLevel !== undefined) {
            // 위험 회피 성향
            modifier *= (1 + (0.5 - p.riskTaking) * option.riskLevel);
        }
        
        return Math.max(0.5, Math.min(1.5, modifier));
    }
    
    // =============================================================================
    // 8. 성격 드라이브 업데이트
    // =============================================================================
    
    updateDrives() {
        const age = this.engine.ageYears;
        const stage = this.currentStage;
        const baseDrives = stage.drives;
        
        // 성격 수정
        const p = this.engine.personality;
        
        this.drives = {
            curiosity: Math.min(1, baseDrives.curiosity + (p.openness - 0.5) * 0.2),
            play: baseDrives.play,
            achievement: Math.min(1, baseDrives.achievement + (p.conscientiousness - 0.5) * 0.2),
            affiliation: Math.min(1, baseDrives.affiliation + (p.extraversion - 0.5) * 0.2),
            autonomy: Math.min(1, baseDrives.autonomy + (p.assertiveness - 0.5) * 0.2),
            
            // 추가 드라이브
            security: Math.max(0, 0.5 - (age - 10) * 0.02),  // 나이 들수록 감소
            romance: age < 12 ? 0 : Math.min(1, (age - 12) * 0.1 + (p.sexualDrive || 0.5) * 0.2),
            maternity: this.maternityPsyche.maternalIdentity || 0
        };
    }
    
    // =============================================================================
    // 9. 대화 생성
    // =============================================================================
    
    generateDialogue(context) {
        const age = this.engine.ageYears;
        const mood = this.currentState.mood;
        const stage = this.engine.relationship?.currentStage;
        
        // 현재 생각 선택
        const thought = this._selectThought();
        
        // 언어 스타일 (나이별)
        const style = this._getLanguageStyle(age);
        
        // 대사 생성
        let dialogue = this._composeDialogue(thought, mood, stage, style);
        
        // 비언어적 행동
        const nonverbal = this._generateNonverbal(mood, context);
        
        return {
            text: dialogue,
            nonverbal,
            innerThought: thought.type !== 'spoken' ? thought.content : null,
            emotion: { ...this.emotion },
            mood
        };
    }
    
    _selectThought() {
        const thoughts = [
            ...this.currentState.intrusiveThoughts,
            ...this.memory.workingMemory.map(m => ({ type: 'memory', content: m.content }))
        ];
        
        if (thoughts.length === 0) {
            return { type: 'idle', content: this._getIdleThought() };
        }
        
        // 강도 기반 선택
        thoughts.sort((a, b) => (b.intensity || 0.5) - (a.intensity || 0.5));
        return thoughts[0];
    }
    
    _getIdleThought() {
        const idleThoughts = [
            '오늘은 뭐 할까...',
            '배고프다...',
            '저 사람은 지금 뭐 하고 있을까...',
            '요즘 날씨 좋다...',
            '조금 졸린데...'
        ];
        return idleThoughts[Math.floor(Math.random() * idleThoughts.length)];
    }
    
    _getLanguageStyle(age) {
        if (age < 12) {
            return {
                vocabulary: 'simple',
                sentenceLength: 'short',
                formality: 'casual_child',
                useDialect: false,
                useSlang: false
            };
        } else if (age < 15) {
            return {
                vocabulary: 'developing',
                sentenceLength: 'medium',
                formality: 'casual_teen',
                useDialect: true,
                useSlang: true
            };
        } else {
            return {
                vocabulary: 'mature',
                sentenceLength: 'variable',
                formality: 'context_dependent',
                useDialect: true,
                useSlang: true
            };
        }
    }
    
    _composeDialogue(thought, mood, stage, style) {
        // 간단한 템플릿 기반 생성
        const templates = this._getDialogueTemplates(mood, stage);
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        return template;
    }
    
    _getDialogueTemplates(mood, stage) {
        const templates = {
            neutral: {
                stranger: ['음... 안녕하세요.', '저기... 뭐 하세요?'],
                friend: ['오늘은 뭐 해?', '나 지금 좀 심심한데...'],
                partner: ['왔구나.', '오늘 하루 어땠어?']
            },
            happy: {
                stranger: ['안녕하세요! 반가워요!', '헤헤, 오늘 기분 좋아요!'],
                friend: ['안녕!! 왔구나! 기다렸어!', '오늘 뭐 재밌는 거 없어?'],
                partner: ['당신 왔구나! 보고 싶었어!', '오늘 너무 좋은 일 있었어!']
            },
            flirty: {
                friend: ['에이, 그런 말 하면... 부끄러워...', '왜 그렇게 쳐다보는 거야...'],
                partner: ['응... 가까이 와...', '당신이랑 있으면... 두근두근해...']
            },
            sad: {
                stranger: ['......', '별로... 안 좋아요...'],
                friend: ['...... (고개 숙임)', '오늘은 좀... 기분이 안 좋아...'],
                partner: ['...... (눈물)', '당신한테만 말할게... 나 오늘...']
            }
        };
        
        return (templates[mood]?.[stage] || templates.neutral[stage] || templates.neutral.stranger);
    }
    
    _generateNonverbal(mood, context) {
        const nonverbals = {
            neutral: ['고개를 갸웃거린다', '손가락으로 뺨을 만진다'],
            happy: ['활짝 웃는다', '손을 흔든다', '발을 동동 군다'],
            flirty: ['볼을 붉힌다', '머리카락을 만진다', '시선을 피했다가 다시 본다'],
            sad: ['고개를 숙인다', '눈물을 흘린다', '어깨를 움츠린다'],
            angry: ['팔짱을 낀다', '등을 돌린다', '발로 바닥을 찬다'],
            scared: ['몸을 움츠린다', '눈을 크게 뜬다', '손을 떤다']
        };
        
        const list = nonverbals[mood] || nonverbals.neutral;
        return list[Math.floor(Math.random() * list.length)];
    }
    
    // =============================================================================
    // 10. 유틸리티
    // =============================================================================
    
    _applyEmotionRegulation(ability) {
        if (ability < 0.3) return; // 조절 불가
        
        // 과도한 감정 억제
        const dampen = (emotion, threshold) => {
            if (this.emotion[emotion] > threshold) {
                this.emotion[emotion] = threshold + (this.emotion[emotion] - threshold) * (1 - ability);
            }
        };
        
        dampen('anger', 0.8);
        dampen('sadness', 0.8);
        dampen('anxiety', 0.7);
        dampen('arousal', 0.9);
    }
    
    _decayEmotions() {
        const decay = 0.95;
        this.emotion.joy *= decay;
        this.emotion.anger *= 0.9;
        this.emotion.sadness *= 0.92;
        this.emotion.fear *= 0.9;
        this.emotion.surprise *= 0.8;
        this.emotion.arousal *= 0.85;
        this.emotion.anxiety *= 0.93;
    }
    
    _updateCurrentMood() {
        const e = this.emotion;
        
        if (e.joy > 0.6 && e.arousal > 0.4) this.currentState.mood = 'flirty';
        else if (e.joy > 0.6) this.currentState.mood = 'happy';
        else if (e.sadness > 0.5) this.currentState.mood = 'sad';
        else if (e.anger > 0.5) this.currentState.mood = 'angry';
        else if (e.fear > 0.5) this.currentState.mood = 'scared';
        else if (e.anxiety > 0.5) this.currentState.mood = 'anxious';
        else this.currentState.mood = 'neutral';
    }
    
    _describeEmotionalShift(prev, curr) {
        const changes = [];
        for (const key of Object.keys(prev)) {
            const diff = (curr[key] || 0) - prev[key];
            if (Math.abs(diff) > 0.1) {
                changes.push(`${key}: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}`);
            }
        }
        return changes.join(', ');
    }
    
    _initializeIdentity() {
        this.identity.values = ['정직', '친절', '배려'];
        this.identity.beliefs = ['세상은 대체로 좋은 곳', '노력하면 이뤄진다'];
        this.identity.goals = ['좋은 사람 되기', '행복하게 살기'];
        this.identity.fears = ['외로움', '버림받음', '실패'];
    }
    
    // =============================================================================
    // 11. 상태 내보내기
    // =============================================================================
    
    getMindStatus() {
        return {
            developmentalStage: this.currentStage?.name,
            age: this.engine.ageYears,
            
            emotion: { ...this.emotion },
            currentMood: this.currentState.mood,
            stressLevel: this.currentState.stressLevel,
            energyLevel: this.currentState.energyLevel,
            
            memory: {
                shortTermCount: this.memory.shortTerm.length,
                longTermEpisodicCount: this.memory.longTerm.episodic.length,
                longTermEmotionalCount: this.memory.longTerm.emotional.length,
                autobiographicalCount: this.memory.longTerm.autobiographical.length,
                repressedCount: this.memory.repressed.length
            },
            
            identity: {
                selfConcept: this.identity.selfConcept,
                bodyImage: this.identity.bodyImage,
                values: this.identity.values
            },
            
            sexualDevelopment: {
                stage: this.sexualDevelopment.stage,
                curiosityLevel: Math.round(this.sexualDevelopment.curiosityLevel * 100) / 100,
                confusionLevel: Math.round(this.sexualDevelopment.confusionLevel * 100) / 100,
                guiltLevel: Math.round(this.sexualDevelopment.guiltLevel * 100) / 100,
                firstRomanticAge: this.sexualDevelopment.firstRomanticAge,
                experienceLevel: Math.round(this.sexualDevelopment.experienceLevel * 100) / 100
            },
            
            maternityPsyche: {
                isPregnant: this.engine.reproductive?.isPregnant || false,
                pregnancyReaction: this.maternityPsyche.pregnancyReaction?.initialEmotion,
                maternalIdentity: Math.round(this.maternityPsyche.maternalIdentity * 100) / 100,
                postpartumMood: {
                    babyBlues: this.maternityPsyche.postpartumMood.babyBlues,
                    depressionRisk: Math.round(this.maternityPsyche.postpartumMood.depressionRisk * 100) / 100,
                    bondingStrength: Math.round(this.maternityPsyche.postpartumMood.bondingStrength * 100) / 100
                }
            },
            
            drives: { ...this.drives },
            
            currentThoughts: this.currentState.intrusiveThoughts.map(t => ({
                type: t.type,
                content: t.content,
                intensity: t.intensity
            }))
        };
    }
}

// 전역 내보내기
if (typeof window !== 'undefined') {
    window.YunseoMind = YunseoMind;
    window.DEVELOPMENTAL_STAGES = DEVELOPMENTAL_STAGES;
}

export { YunseoMind, DEVELOPMENTAL_STAGES };
