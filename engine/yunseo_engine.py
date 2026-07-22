"""
윤서(Yunseo) 통합 시뮬레이션 엔진 v1.1
- 유전, 성장, 호르몬, 성격, 성적, 관계, 생식, 아이 성장 시스템 통합
- 임신·출산·수유 메커니즘 상세 구현
- PWA 연동을 위한 REST API 지원
"""

import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any


# =============================================================================
# 1. GENETIC ENGINE (유전 엔진)
# =============================================================================

class GeneticEngine:
    """부모 DNA로부터 자녀 DNA를 생성하는 유전 엔진"""

    TRAITS = [
        'height', 'weight_tendency', 'skin_tone', 'hair_texture',
        'eye_color', 'body_frame', 'metabolism', 'fertility',
        'hormone_sensitivity', 'stress_resilience', 'libido_baseline',
        'aesthetic_preference', 'social_drive', 'curiosity',
        'empathy', 'assertiveness', 'risk_taking'
    ]

    def __init__(self, seed: int = None):
        self.rng = random.Random(seed)

    def generate_dna(self, parent1_dna: Dict = None, parent2_dna: Dict = None) -> Dict:
        """부모 DNA로부터 자녀 DNA 생성 (돌연변이 1%)"""
        dna = {}
        for trait in self.TRAITS:
            if parent1_dna and parent2_dna and trait in parent1_dna and trait in parent2_dna:
                base = (parent1_dna[trait] + parent2_dna[trait]) / 2
                mutation = self.rng.gauss(0, 0.1) if self.rng.random() < 0.01 else 0
                dna[trait] = max(0.0, min(1.0, base + mutation))
            else:
                dna[trait] = self.rng.random()
        return dna

    def get_fertility_bonus(self, dna: Dict) -> float:
        return dna.get('fertility', 0.5) * 0.05


# =============================================================================
# 2. GROWTH ENGINE (성장 엔진)
# =============================================================================

class GrowthEngine:
    """대한민국 7차 인체치수조사 기반 성장 데이터"""

    GROWTH_DATA = {
        0: (49.0, 3.2), 1: (54.0, 4.5), 2: (58.0, 5.5), 3: (61.0, 6.2),
        4: (64.0, 6.8), 5: (67.0, 7.4), 6: (69.5, 7.9), 7: (72.0, 8.4),
        8: (74.0, 8.8), 9: (76.0, 9.2), 10: (78.0, 9.6), 11: (80.0, 10.0),
        12: (82.0, 10.4), 13: (84.0, 10.8), 14: (86.0, 11.2), 15: (88.0, 11.6),
        16: (90.0, 12.0), 17: (91.5, 12.4), 18: (93.0, 12.8), 19: (94.5, 13.2),
        20: (96.0, 13.6), 21: (97.5, 14.0), 22: (99.0, 14.4), 23: (100.5, 14.8),
        24: (102.0, 15.2), 30: (108.0, 16.5), 36: (114.0, 18.0),
        48: (124.0, 22.0), 60: (132.0, 26.0), 72: (140.0, 30.0),
        84: (148.0, 35.0), 96: (155.0, 42.0), 108: (160.0, 48.0),
        120: (163.0, 50.0), 132: (164.5, 51.5), 144: (165.5, 52.5),
        156: (166.0, 53.0), 168: (166.2, 53.2), 180: (166.3, 53.3),
        192: (166.5, 53.5), 204: (166.5, 53.5), 216: (166.5, 53.5),
        228: (166.5, 53.5)
    }

    PUBERTY_AGE = 10.5

    def __init__(self, dna: Dict, seed: int = None):
        self.rng = random.Random(seed)
        self.dna = dna
        self.height_gene = dna.get('height', 0.5)
        self.weight_gene = dna.get('weight_tendency', 0.5)

    def get_body_at_age(self, age_years: float) -> Dict:
        months = int(age_years * 12)
        available_months = sorted(self.GROWTH_DATA.keys())
        closest = min(available_months, key=lambda x: abs(x - months))
        base_height, base_weight = self.GROWTH_DATA[closest]

        height = base_height * (0.9 + self.height_gene * 0.2)
        weight = base_weight * (0.85 + self.weight_gene * 0.3)

        bust = self._calculate_bust(age_years, weight)
        waist = self._calculate_waist(age_years, weight)
        hip = self._calculate_hip(age_years, weight)

        return {
            'height_cm': round(height, 1),
            'weight_kg': round(weight, 1),
            'bust_cm': round(bust, 1),
            'waist_cm': round(waist, 1),
            'hip_cm': round(hip, 1),
            'bmi': round(weight / ((height/100) ** 2), 1)
        }

    def _calculate_bust(self, age: float, weight: float) -> float:
        if age < self.PUBERTY_AGE:
            return weight * 0.5 + age * 2
        base = 70 + (age - self.PUBERTY_AGE) * 3
        return base + self.rng.gauss(0, 3)

    def _calculate_waist(self, age: float, weight: float) -> float:
        if age < self.PUBERTY_AGE:
            return weight * 0.45 + age * 1.5
        base = 55 + (age - self.PUBERTY_AGE) * 1.5
        return base + self.rng.gauss(0, 2)

    def _calculate_hip(self, age: float, weight: float) -> float:
        if age < self.PUBERTY_AGE:
            return weight * 0.55 + age * 2
        base = 75 + (age - self.PUBERTY_AGE) * 2.5
        return base + self.rng.gauss(0, 3)


# =============================================================================
# 3. HORMONAL ENGINE (호르몬 엔진)
# =============================================================================

class HormonalEngine:
    """여성 호르몬 주기 시뮬레이션"""

    CYCLE_LENGTH = 28

    def __init__(self, dna: Dict, seed: int = None):
        self.rng = random.Random(seed)
        self.dna = dna
        self.hormone_sensitivity = dna.get('hormone_sensitivity', 0.5)
        self.cycle_day = 1
        self.is_pregnant = False
        self.pregnancy_week = 0

    def get_hormone_levels(self, day: int = None) -> Dict:
        if day is None:
            day = self.cycle_day

        if self.is_pregnant:
            return self._get_pregnancy_hormones()

        if day <= 14:
            estrogen = 50 + (day / 14) * 350
        else:
            estrogen = 400 - ((day - 14) / 14) * 250

        if day <= 14:
            progesterone = 1 + (day / 14) * 4
        else:
            progesterone = 5 + ((day - 14) / 14) * 15

        if 10 <= day <= 16:
            testosterone = 0.4 + 0.2 * self.rng.random()
        else:
            testosterone = 0.2 + 0.1 * self.rng.random()

        if 12 <= day <= 16:
            lh = 20 + 80 * self.rng.random()
        else:
            lh = 5 + 10 * self.rng.random()

        fsh = 5 + 15 * self.rng.random()

        return {
            'estrogen_pg_ml': round(estrogen, 1),
            'progesterone_ng_ml': round(progesterone, 1),
            'testosterone_ng_ml': round(testosterone, 2),
            'lh_miu_ml': round(lh, 1),
            'fsh_miu_ml': round(fsh, 1),
            'cycle_day': day,
            'fertility_window': 10 <= day <= 16
        }

    def _get_pregnancy_hormones(self) -> Dict:
        week = self.pregnancy_week

        if week <= 4:
            hcg = 5 + week * 500
        elif week <= 8:
            hcg = 2000 + (week - 4) * 15000
        elif week <= 12:
            hcg = 80000 - (week - 8) * 5000
        else:
            hcg = max(5000, 60000 - (week - 12) * 1000)

        progesterone = 20 + week * 0.5
        estrogen = 400 + week * 100
        prolactin = 10 + week * 5
        relaxin = 0.5 + week * 0.1

        return {
            'estrogen_pg_ml': round(estrogen, 1),
            'progesterone_ng_ml': round(progesterone, 1),
            'testosterone_ng_ml': 0.3,
            'lh_miu_ml': 0.1,
            'fsh_miu_ml': 0.1,
            'hcg_miu_ml': round(hcg, 1),
            'prolactin_ng_ml': round(prolactin, 1),
            'relaxin_ng_ml': round(relaxin, 2),
            'pregnancy_week': week,
            'fertility_window': False
        }

    def advance_cycle(self, days: int = 1):
        if self.is_pregnant:
            self.pregnancy_week += days / 7
            return
        self.cycle_day = ((self.cycle_day - 1 + days) % self.CYCLE_LENGTH) + 1

    def check_ovulation(self) -> bool:
        return 12 <= self.cycle_day <= 16 and not self.is_pregnant

    def get_cervical_mucus(self) -> str:
        if self.is_pregnant:
            return 'thick_plug'
        day = self.cycle_day
        if day <= 5: return 'dry'
        elif day <= 10: return 'sticky'
        elif day <= 12: return 'creamy'
        elif day <= 16: return 'egg_white_stretchy'
        elif day <= 20: return 'watery'
        else: return 'sticky'

    def get_cervical_mucus_quality(self) -> float:
        mucus = self.get_cervical_mucus()
        quality_map = {
            'dry': 0.001, 'sticky': 0.01, 'creamy': 0.05,
            'egg_white_stretchy': 0.15, 'watery': 0.20, 'thick_plug': 0.0
        }
        return quality_map.get(mucus, 0.01)


# =============================================================================
# 4. PERSONALITY SYSTEM (성격 시스템)
# =============================================================================

class PersonalitySystem:
    """Big Five + 성적 특성"""

    def __init__(self, dna: Dict, seed: int = None):
        self.rng = random.Random(seed)
        self.dna = dna

        self.openness = dna.get('curiosity', 0.5)
        self.conscientiousness = dna.get('assertiveness', 0.5)
        self.extraversion = dna.get('social_drive', 0.5)
        self.agreeableness = dna.get('empathy', 0.5)
        self.neuroticism = 1 - dna.get('stress_resilience', 0.5)

        self.sexual_curiosity = dna.get('curiosity', 0.5) * 0.7 + self.openness * 0.3
        self.sexual_drive = dna.get('libido_baseline', 0.5)
        self.sexual_openness = self.openness * 0.6 + self.sexual_curiosity * 0.4
        self.risk_taking = dna.get('risk_taking', 0.5)

    def get_personality_summary(self) -> Dict:
        return {
            'big_five': {
                'openness': round(self.openness, 2),
                'conscientiousness': round(self.conscientiousness, 2),
                'extraversion': round(self.extraversion, 2),
                'agreeableness': round(self.agreeableness, 2),
                'neuroticism': round(self.neuroticism, 2)
            },
            'sexual_traits': {
                'curiosity': round(self.sexual_curiosity, 2),
                'drive': round(self.sexual_drive, 2),
                'openness': round(self.sexual_openness, 2),
                'risk_taking': round(self.risk_taking, 2)
            }
        }

    def get_reaction_to_action(self, action: str, intensity: float) -> Tuple[str, float]:
        reactions = {
            'greeting': ('neutral', 0.3),
            'talk': ('curious', 0.4),
            'praise': ('happy', 0.5),
            'flirt': ('flustered', 0.6),
            'touch': ('nervous', 0.7),
            'kiss': ('excited', 0.8),
            'intimacy': ('aroused', 0.9)
        }
        return reactions.get(action, ('neutral', 0.3))


# =============================================================================
# 5. SEXUAL SYSTEM (성적 시스템)
# =============================================================================

class SexualSystem:
    """16체위, 12플레이, 15개 성감대"""

    POSITIONS = {
        'missionary': {'intimacy': 0.8, 'pleasure': 0.7, 'difficulty': 0.2, 'pregnancy_risk': 0.9},
        'doggy': {'intimacy': 0.5, 'pleasure': 0.9, 'difficulty': 0.3, 'pregnancy_risk': 0.85},
        'cowgirl': {'intimacy': 0.7, 'pleasure': 0.85, 'difficulty': 0.4, 'pregnancy_risk': 0.8},
        'spooning': {'intimacy': 0.9, 'pleasure': 0.6, 'difficulty': 0.2, 'pregnancy_risk': 0.7},
        'standing': {'intimacy': 0.5, 'pleasure': 0.7, 'difficulty': 0.7, 'pregnancy_risk': 0.6},
        'lotus': {'intimacy': 0.95, 'pleasure': 0.75, 'difficulty': 0.5, 'pregnancy_risk': 0.85},
        'butterfly': {'intimacy': 0.6, 'pleasure': 0.8, 'difficulty': 0.6, 'pregnancy_risk': 0.75},
        'reverse_cowgirl': {'intimacy': 0.4, 'pleasure': 0.9, 'difficulty': 0.5, 'pregnancy_risk': 0.8},
        'side_by_side': {'intimacy': 0.85, 'pleasure': 0.65, 'difficulty': 0.3, 'pregnancy_risk': 0.7},
        'prone_bone': {'intimacy': 0.4, 'pleasure': 0.85, 'difficulty': 0.3, 'pregnancy_risk': 0.9},
        'seated': {'intimacy': 0.75, 'pleasure': 0.7, 'difficulty': 0.4, 'pregnancy_risk': 0.8},
        'wheelbarrow': {'intimacy': 0.3, 'pleasure': 0.8, 'difficulty': 0.9, 'pregnancy_risk': 0.5},
        'scissors': {'intimacy': 0.7, 'pleasure': 0.75, 'difficulty': 0.5, 'pregnancy_risk': 0.6},
        'bridge': {'intimacy': 0.5, 'pleasure': 0.8, 'difficulty': 0.8, 'pregnancy_risk': 0.7},
        'table': {'intimacy': 0.6, 'pleasure': 0.75, 'difficulty': 0.4, 'pregnancy_risk': 0.85},
        'suspended': {'intimacy': 0.4, 'pleasure': 0.85, 'difficulty': 0.95, 'pregnancy_risk': 0.4}
    }

    PLAYS = [
        'oral', 'manual', 'toy', 'roleplay', 'bdsm_light',
        'sensory_deprivation', 'temperature_play', 'dirty_talk',
        'mutual_masturbation', 'edging', 'anal_play', 'exhibitionism'
    ]

    EROGENOUS_ZONES = {
        'lips': {'sensitivity': 0.9, 'intimacy_level': 1},
        'neck': {'sensitivity': 0.85, 'intimacy_level': 2},
        'ears': {'sensitivity': 0.8, 'intimacy_level': 2},
        'breasts': {'sensitivity': 0.9, 'intimacy_level': 3},
        'nipples': {'sensitivity': 0.95, 'intimacy_level': 3},
        'navel': {'sensitivity': 0.6, 'intimacy_level': 3},
        'inner_thighs': {'sensitivity': 0.9, 'intimacy_level': 4},
        'clitoris': {'sensitivity': 1.0, 'intimacy_level': 5},
        'vagina': {'sensitivity': 0.95, 'intimacy_level': 5},
        'g_spot': {'sensitivity': 0.98, 'intimacy_level': 5},
        'cervix': {'sensitivity': 0.7, 'intimacy_level': 5},
        'perineum': {'sensitivity': 0.85, 'intimacy_level': 4},
        'buttocks': {'sensitivity': 0.75, 'intimacy_level': 3},
        'lower_back': {'sensitivity': 0.7, 'intimacy_level': 2},
        'scalp': {'sensitivity': 0.65, 'intimacy_level': 1}
    }

    def __init__(self, personality: PersonalitySystem, seed: int = None):
        self.rng = random.Random(seed)
        self.personality = personality
        self.experience_level = 0.0
        self.discovered_zones = set()
        self.preferred_positions = []
        self.preferred_plays = []

    def get_position_result(self, position: str, intensity: float) -> Dict:
        if position not in self.POSITIONS:
            return {'error': 'Unknown position'}

        pos = self.POSITIONS[position]
        exp_bonus = min(self.experience_level * 0.2, 0.3)
        openness_bonus = self.personality.sexual_openness * 0.1
        drive_bonus = self.personality.sexual_drive * 0.1

        pleasure = min(1.0, pos['pleasure'] + exp_bonus + openness_bonus + drive_bonus)
        intimacy = min(1.0, pos['intimacy'] + openness_bonus)

        orgasm_chance = pleasure * intensity * (0.5 + self.experience_level * 0.3)
        orgasm = self.rng.random() < orgasm_chance

        self.experience_level = min(1.0, self.experience_level + 0.05)

        return {
            'position': position,
            'pleasure': round(pleasure, 2),
            'intimacy': round(intimacy, 2),
            'orgasm': orgasm,
            'pregnancy_risk': pos['pregnancy_risk'],
            'difficulty': pos['difficulty']
        }

    def get_play_result(self, play: str, intensity: float) -> Dict:
        if play not in self.PLAYS:
            return {'error': 'Unknown play'}

        preference = self.rng.random() * self.personality.sexual_openness

        return {
            'play': play,
            'enjoyment': round(preference * intensity, 2),
            'novelty': round(1 - self.experience_level, 2),
            'intimacy_gain': round(intensity * 0.1, 2)
        }

    def stimulate_zone(self, zone: str, intensity: float) -> Dict:
        if zone not in self.EROGENOUS_ZONES:
            return {'error': 'Unknown zone'}

        zone_data = self.EROGENOUS_ZONES[zone]
        sensitivity = zone_data['sensitivity']
        response = sensitivity * intensity * (0.5 + self.personality.sexual_drive * 0.5)

        self.discovered_zones.add(zone)

        return {
            'zone': zone,
            'sensitivity': round(sensitivity, 2),
            'response': round(response, 2),
            'pleasure': round(response * intensity, 2),
            'intimacy_required': zone_data['intimacy_level']
        }


# =============================================================================
# 6. RELATIONSHIP SYSTEM (관계 시스템)
# =============================================================================

class RelationshipSystem:
    """7단계 관계 발전 시스템"""

    STAGES = [
        'stranger', 'acquaintance', 'friend', 'close_friend',
        'partner', 'engaged', 'spouse'
    ]

    STAGE_REQUIREMENTS = {
        'stranger': {'trust': 0, 'intimacy': 0, 'passion': 0, 'commitment': 0},
        'acquaintance': {'trust': 20, 'intimacy': 10, 'passion': 5, 'commitment': 0},
        'friend': {'trust': 40, 'intimacy': 25, 'passion': 10, 'commitment': 5},
        'close_friend': {'trust': 60, 'intimacy': 45, 'passion': 20, 'commitment': 15},
        'partner': {'trust': 70, 'intimacy': 65, 'passion': 50, 'commitment': 40},
        'engaged': {'trust': 85, 'intimacy': 80, 'passion': 60, 'commitment': 80},
        'spouse': {'trust': 95, 'intimacy': 90, 'passion': 70, 'commitment': 100}
    }

    ALLOWED_ACTIONS = {
        'stranger': ['greeting', 'talk'],
        'acquaintance': ['greeting', 'talk', 'praise'],
        'friend': ['greeting', 'talk', 'praise', 'flirt', 'touch'],
        'close_friend': ['greeting', 'talk', 'praise', 'flirt', 'touch', 'kiss'],
        'partner': ['greeting', 'talk', 'praise', 'flirt', 'touch', 'kiss', 'intimacy'],
        'engaged': ['greeting', 'talk', 'praise', 'flirt', 'touch', 'kiss', 'intimacy'],
        'spouse': ['greeting', 'talk', 'praise', 'flirt', 'touch', 'kiss', 'intimacy']
    }

    def __init__(self, seed: int = None):
        self.rng = random.Random(seed)
        self.current_stage = 'stranger'
        self.stage_index = 0
        self.metrics = {'trust': 0.0, 'intimacy': 0.0, 'passion': 0.0, 'commitment': 0.0}
        self.interaction_history = []
        self.days_since_meet = 0

    def get_allowed_actions(self) -> List[str]:
        return self.ALLOWED_ACTIONS.get(self.current_stage, ['greeting', 'talk'])

    def interact(self, action: str, intensity: float, personality: PersonalitySystem) -> Dict:
        if action not in self.get_allowed_actions():
            return {
                'success': False,
                'reason': f'Action "{action}" not allowed at stage "{self.current_stage}"',
                'current_stage': self.current_stage
            }

        emotion, base_intensity = personality.get_reaction_to_action(action, intensity)

        action_effects = {
            'greeting': {'trust': 2, 'intimacy': 1, 'passion': 0, 'commitment': 0},
            'talk': {'trust': 3, 'intimacy': 2, 'passion': 1, 'commitment': 1},
            'praise': {'trust': 2, 'intimacy': 3, 'passion': 2, 'commitment': 1},
            'flirt': {'trust': 1, 'intimacy': 4, 'passion': 5, 'commitment': 2},
            'touch': {'trust': 3, 'intimacy': 5, 'passion': 4, 'commitment': 2},
            'kiss': {'trust': 4, 'intimacy': 7, 'passion': 8, 'commitment': 5},
            'intimacy': {'trust': 5, 'intimacy': 10, 'passion': 12, 'commitment': 8}
        }

        effects = action_effects.get(action, {'trust': 1, 'intimacy': 1, 'passion': 0, 'commitment': 0})

        for key in self.metrics:
            gain = effects[key] * intensity * (0.8 + self.rng.random() * 0.4)
            self.metrics[key] = min(100, self.metrics[key] + gain)

        stage_changed = self._check_stage_advance()

        self.interaction_history.append({
            'action': action,
            'intensity': intensity,
            'emotion': emotion,
            'metrics_after': dict(self.metrics)
        })

        return {
            'success': True,
            'emotion': emotion,
            'stage_changed': stage_changed,
            'current_stage': self.current_stage,
            'metrics': {k: round(v, 1) for k, v in self.metrics.items()}
        }

    def _check_stage_advance(self) -> bool:
        if self.stage_index >= len(self.STAGES) - 1:
            return False

        next_stage = self.STAGES[self.stage_index + 1]
        requirements = self.STAGE_REQUIREMENTS[next_stage]

        if all(self.metrics[key] >= requirements[key] for key in requirements):
            self.stage_index += 1
            self.current_stage = next_stage
            return True

        return False

    def get_status(self) -> Dict:
        return {
            'stage': self.current_stage,
            'stage_index': self.stage_index,
            'metrics': {k: round(v, 1) for k, v in self.metrics.items()},
            'allowed_actions': self.get_allowed_actions(),
            'days_since_meet': self.days_since_meet
        }


# =============================================================================
# 7. REPRODUCTIVE SYSTEM (생식 시스템)
# =============================================================================

class ReproductiveSystem:
    """임신, 출산, 산후 회복, 수유 시뮬레이션"""

    def __init__(self, dna, hormonal, growth, seed=None):
        self.rng = random.Random(seed)
        self.dna = dna
        self.hormonal = hormonal
        self.growth = growth

        self.is_pregnant = False
        self.pregnancy_week = 0
        self.pregnancy_day = 0
        self.pregnancy_start_date = None

        self.postpartum_day = 0
        self.is_postpartum = False

        self.children = []
        self.pregnancy_history = []

        self.fertility_bonus = GeneticEngine().get_fertility_bonus(dna)

    def simulate_ejaculation(self, arousal_level=0.7, abstinence_days=3):
        base_volume = 2.0 + arousal_level * 4.0
        volume = max(1.5, min(8.0, base_volume + self.rng.gauss(0, 0.5)))

        base_concentration = 60 + arousal_level * 40
        abstinence_multiplier = self._get_abstinence_multiplier(abstinence_days)
        concentration = max(15, min(150, base_concentration * abstinence_multiplier + self.rng.gauss(0, 10)))

        total_sperm = volume * concentration
        motility = max(0.30, min(0.70, 0.40 + arousal_level * 0.20 + self.rng.gauss(0, 0.05)))
        morphology = max(0.02, min(0.15, 0.04 + arousal_level * 0.06 + self.rng.gauss(0, 0.02)))
        viable_sperm = total_sperm * motility * morphology

        return {
            'semen_volume_ml': round(volume, 2),
            'sperm_count_per_ml_million': round(concentration, 1),
            'total_sperm_million': round(total_sperm, 1),
            'sperm_motility_percent': round(motility * 100, 1),
            'sperm_morphology_percent': round(morphology * 100, 1),
            'viable_sperm_million': round(viable_sperm, 2),
            'abstinence_days': abstinence_days,
            'abstinence_multiplier': round(abstinence_multiplier, 2)
        }

    def _get_abstinence_multiplier(self, days):
        if days < 1: return 0.6
        elif days <= 3: return 1.0
        elif days <= 7: return 1.2
        else: return 1.0

    def calculate_fertilization_probability(self, sperm_data, age):
        viable_sperm = sperm_data['viable_sperm_million']
        mucus_quality = self.hormonal.get_cervical_mucus_quality()
        cervical_pass = viable_sperm * mucus_quality
        fallopian_survival = cervical_pass * 0.001
        egg_meet_chance = min(0.9, fallopian_survival / 100) if fallopian_survival > 0 else 0

        egg_quality = 0.85 if 20 <= age <= 29 else max(0.5, 0.85 - abs(age - 25) * 0.02)
        fertilization_success = 0.75 * egg_quality

        return min(0.95, max(0.0, egg_meet_chance * fertilization_success))

    def calculate_implantation_probability(self):
        base_rate = 0.40
        hormone_levels = self.hormonal.get_hormone_levels()
        progesterone = hormone_levels.get('progesterone_ng_ml', 15)
        endometrium_quality = min(1.0, progesterone / 20)
        embryo_quality = max(0.5, min(1.0, 0.80 + self.rng.gauss(0, 0.1)))

        return min(0.90, max(0.0, base_rate * endometrium_quality * embryo_quality))

    def calculate_pregnancy_probability(self, sperm_data, age):
        fertilization_prob = self.calculate_fertilization_probability(sperm_data, age)
        implantation_prob = self.calculate_implantation_probability()
        base_pregnancy = fertilization_prob * implantation_prob

        realistic_base = 0.22
        adjusted_prob = realistic_base * (base_pregnancy / 0.15) + self.fertility_bonus + self._get_age_adjustment(age)
        final_prob = min(0.35, max(0.05, adjusted_prob))

        return {
            'fertilization_probability': round(fertilization_prob, 4),
            'implantation_probability': round(implantation_prob, 4),
            'base_pregnancy_probability': round(base_pregnancy, 4),
            'genetic_bonus': round(self.fertility_bonus, 4),
            'age_adjustment': round(self._get_age_adjustment(age), 4),
            'final_probability': round(final_prob, 4),
            'fertility_window': self.hormonal.get_hormone_levels()['fertility_window']
        }

    def _get_age_adjustment(self, age):
        if age < 15: return -0.10
        elif age < 20: return -0.03
        elif age < 30: return 0.0
        elif age < 35: return -0.03
        else: return -0.08

    def attempt_pregnancy(self, sperm_data, age, current_date):
        if self.is_pregnant or self.is_postpartum:
            return {'success': False, 'reason': 'Already pregnant or postpartum'}

        prob_data = self.calculate_pregnancy_probability(sperm_data, age)
        success = self.rng.random() < prob_data['final_probability']

        if success:
            self.is_pregnant = True
            self.pregnancy_week = 0
            self.pregnancy_day = 0
            self.pregnancy_start_date = current_date
            self.hormonal.is_pregnant = True
            self.hormonal.pregnancy_week = 0

        return {
            'success': success,
            'probability': round(prob_data['final_probability'], 4),
            'details': prob_data,
            'pregnancy_started': success
        }

    def advance_pregnancy(self, weeks=1):
        if not self.is_pregnant:
            return {'error': 'Not pregnant'}

        self.pregnancy_week += weeks
        self.pregnancy_day += weeks * 7
        self.hormonal.pregnancy_week = self.pregnancy_week

        body_changes = self.get_pregnancy_body_changes()

        if self.pregnancy_week >= 40:
            return {
                'week': self.pregnancy_week,
                'ready_for_birth': True,
                'body_changes': body_changes
            }

        return {
            'week': self.pregnancy_week,
            'day': self.pregnancy_day,
            'trimester': self._get_trimester(),
            'body_changes': body_changes,
            'hormones': self.hormonal.get_hormone_levels()
        }

    def _get_trimester(self):
        if self.pregnancy_week <= 12: return 1
        elif self.pregnancy_week <= 27: return 2
        else: return 3

    def get_pregnancy_body_changes(self):
        week = self.pregnancy_week
        base_body = self.growth.get_body_at_age(20)

        weight_gain = self._calculate_weight_gain(week)
        breast_changes = self._calculate_breast_changes(week)
        skin_changes = self._calculate_skin_changes(week)
        belly_changes = self._calculate_belly_changes(week)

        return {
            'week': week,
            'trimester': self._get_trimester(),
            'weight': {
                'base_kg': base_body['weight_kg'],
                'gain_kg': round(weight_gain, 1),
                'current_kg': round(base_body['weight_kg'] + weight_gain, 1)
            },
            'breasts': breast_changes,
            'skin': skin_changes,
            'belly': belly_changes,
            'uterus_height_cm': self._get_uterus_height(week)
        }

    def _calculate_weight_gain(self, week):
        if week <= 12: return week * 0.5
        elif week <= 27: return 6 + (week - 12) * 0.4
        else: return 12 + (week - 27) * 0.5

    def _calculate_breast_changes(self, week):
        if week < 4:
            return {'size_increase_cm': 0, 'nipple_darkening': 0, 'colostrum': 0}
        return {
            'size_increase_cm': round(min(7, (week - 4) * 0.25), 1),
            'nipple_darkening': round(min(10, (week - 4) * 0.35), 1),
            'colostrum_secretion': round(max(0, (week - 16) * 0.5), 1)
        }

    def _calculate_skin_changes(self, week):
        if week < 8:
            pigmentation, melasma, linea_nigra = 0, 0, 0
        elif week < 12:
            pigmentation = (week - 8) * 0.5
            melasma = 0
            linea_nigra = (week - 8) * 1.0
        elif week < 16:
            pigmentation = 2 + (week - 12) * 1.0
            melasma = (week - 12) * 1.5
            linea_nigra = 4 + (week - 12) * 0.5
        elif week < 24:
            pigmentation = 6 + (week - 16) * 0.25
            melasma = 6 + (week - 16) * 0.25
            linea_nigra = 6 + (week - 16) * 0.125
        else:
            pigmentation = min(10, 8 + (week - 24) * 0.125)
            melasma = min(10, 8 + (week - 24) * 0.125)
            linea_nigra = min(9, 7 + (week - 24) * 0.125)

        stretch_marks = max(0, (week - 20) * 0.5)

        return {
            'general_pigmentation': round(pigmentation, 1),
            'melasma': round(melasma, 1),
            'linea_nigra': round(linea_nigra, 1),
            'stretch_marks': round(stretch_marks, 1),
            'areas': self._get_pigmentation_areas(week)
        }

    def _get_pigmentation_areas(self, week):
        areas = []
        if week >= 8: areas.extend(['nipples', 'areola'])
        if week >= 12: areas.append('linea_nigra')
        if week >= 16: areas.append('face_melasma')
        if week >= 24: areas.extend(['neck', 'armpits', 'inner_thighs'])
        return areas

    def _calculate_belly_changes(self, week):
        if week < 12:
            return {'visible': False, 'size': 'none', 'fundal_height': 0}

        fundal_height = max(0, (week - 12) * 1.0)
        if week < 16: size = 'slight_bulge'
        elif week < 28: size = 'noticeable'
        elif week < 36: size = 'prominent'
        else: size = 'full_term'

        return {
            'visible': True,
            'size': size,
            'fundal_height_cm': round(fundal_height, 1),
            'stretch_marks_risk': min(10, (week - 20) * 0.5) if week > 20 else 0
        }

    def _get_uterus_height(self, week):
        if week < 12: return 0
        return (week - 12) * 1.0

    def give_birth(self, current_date):
        if not self.is_pregnant:
            return {'error': 'Not pregnant'}
        if self.pregnancy_week < 37:
            return {'error': 'Too early for birth', 'week': self.pregnancy_week}

        delivery_type = 'vaginal' if self.rng.random() < 0.85 else 'cesarean'
        child = self._generate_child(current_date)
        self.children.append(child)

        pregnancy_record = {
            'start_date': self.pregnancy_start_date,
            'birth_date': current_date,
            'duration_weeks': self.pregnancy_week,
            'delivery_type': delivery_type,
            'child': child
        }
        self.pregnancy_history.append(pregnancy_record)

        self.is_pregnant = False
        self.pregnancy_week = 0
        self.pregnancy_day = 0
        self.pregnancy_start_date = None
        self.hormonal.is_pregnant = False
        self.hormonal.pregnancy_week = 0

        self.is_postpartum = True
        self.postpartum_day = 0

        return {
            'event': 'birth',
            'delivery_type': delivery_type,
            'child': child,
            'postpartum_started': True
        }

    def _generate_child(self, birth_date):
        sex = 'female' if self.rng.random() < 0.5 else 'male'
        child_dna = GeneticEngine(seed=self.rng.randint(0, 10000)).generate_dna(self.dna, self.dna)

        return {
            'sex': sex,
            'birth_date': birth_date.isoformat(),
            'birth_weight_kg': round(2.8 + self.rng.gauss(0, 0.4), 2),
            'birth_length_cm': round(48 + self.rng.gauss(0, 2), 1),
            'apgar_score': self.rng.randint(7, 10),
            'dna': child_dna,
            'name': None
        }

    def advance_postpartum(self, days=1):
        if not self.is_postpartum:
            return {'error': 'Not in postpartum period'}

        self.postpartum_day += days

        if self.postpartum_day >= 42:
            self.is_postpartum = False
            self.postpartum_day = 0
            return {
                'postpartum_day': 0,
                'status': 'recovered',
                'message': 'Postpartum period completed'
            }

        return {
            'postpartum_day': self.postpartum_day,
            'uterus_recovery': self._get_uterus_recovery(),
            'lochia': self._get_lochia_status(),
            'lactation': self._get_lactation_status(),
            'hormone_recovery': self._get_hormone_recovery(),
            'physical_recovery': self._get_physical_recovery()
        }

    def _get_uterus_recovery(self):
        day = self.postpartum_day
        if day <= 1: height, size = 12, 'grapefruit'
        elif day <= 3: height, size = 10, 'softball'
        elif day <= 7: height, size = 7, 'baseball'
        elif day <= 14: height, size = 3, 'tennis_ball'
        elif day <= 21: height, size = 0, 'normal'
        else: height, size = 0, 'pre_pregnancy'

        return {
            'fundal_height_cm': height,
            'size_description': size,
            'recovery_percent': min(100, day * 2.4)
        }

    def _get_lochia_status(self):
        day = self.postpartum_day
        if day <= 3: return {'type': 'rubra', 'color': 'bright_red', 'amount': 'heavy'}
        elif day <= 10: return {'type': 'serosa', 'color': 'pink_brown', 'amount': 'moderate'}
        else: return {'type': 'alba', 'color': 'white_yellow', 'amount': 'light'}

    def _get_lactation_status(self):
        day = self.postpartum_day

        if day <= 3:
            stage, color, daily_volume_ml, antibodies = 'colostrum', 'golden_yellow', 30, 'very_high'
        elif day <= 14:
            stage, color, daily_volume_ml, antibodies = 'transitional', 'creamy_white', 200 + (day - 3) * 30, 'high'
        else:
            stage, color, daily_volume_ml, antibodies = 'mature', 'white', min(1000, 500 + (day - 14) * 20), 'moderate'

        if day <= 7: prolactin = 300 - day * 7
        elif day <= 30: prolactin = 250 - (day - 7) * 2
        elif day <= 90: prolactin = 200 - (day - 30) * 0.8
        else: prolactin = 150

        return {
            'stage': stage,
            'color': color,
            'daily_volume_ml': daily_volume_ml,
            'antibodies': antibodies,
            'prolactin_ng_ml': round(prolactin, 1),
            'oxytocin_reflex': day > 2
        }

    def _get_hormone_recovery(self):
        day = self.postpartum_day
        return {
            'estrogen_pg_ml': round(min(400, day * 10), 1),
            'progesterone_ng_ml': round(min(20, 1 + day * 0.5), 1),
            'hcg_miu_ml': round(max(0, 1000 - day * 20), 1),
            'cycle_resumed': day > 21
        }

    def _get_physical_recovery(self):
        day = self.postpartum_day
        return {
            'immediate_weight_loss_kg': 6.0,
            'ongoing_weight_loss_kg': round(0.5 * (day / 7), 2),
            'melasma_fade_percent': round(min(1.0, day / 84) * 100, 1),
            'linea_nigra_fade_percent': round(min(1.0, day / 168) * 100, 1),
            'nipple_color_recovery_percent': round(min(1.0, day / 112) * 100, 1),
            'stretch_marks': 'permanent_but_fade'
        }

    def get_pregnancy_status(self):
        if not self.is_pregnant:
            return {'is_pregnant': False}
        return {
            'is_pregnant': True,
            'week': self.pregnancy_week,
            'day': self.pregnancy_day,
            'trimester': self._get_trimester(),
            'body_changes': self.get_pregnancy_body_changes(),
            'hormones': self.hormonal.get_hormone_levels()
        }

    def get_postpartum_status(self):
        if not self.is_postpartum:
            return {'is_postpartum': False}
        return {
            'is_postpartum': True,
            'day': self.postpartum_day,
            'uterus': self._get_uterus_recovery(),
            'lochia': self._get_lochia_status(),
            'lactation': self._get_lactation_status()
        }


# =============================================================================
# 8. CHILD GROWTH SYSTEM (아이 성장 시스템)
# =============================================================================

class ChildGrowthSystem:
    """아이 이름 생성 및 0~24개월 성장 시뮬레이션"""

    KOREAN_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']

    TRADITIONAL_NAMES_FEMALE = [
        '서연', '민서', '지우', '서현', '지민', '수아', '지유', '채원', '지윤', '은서',
        '수빈', '지안', '소윤', '예은', '수민', '지원', '예린', '윤서', '예진', '소민',
        '지은', '수연', '예원', '민지', '서영', '채은', '유진', '지현', '소연', '예지'
    ]

    TRADITIONAL_NAMES_MALE = [
        '민준', '서준', '도윤', '예준', '시우', '하준', '지호', '주원', '준우', '준서',
        '건우', '현우', '민재', '우진', '은우', '시윤', '지훈', '지환', '재윤', '민우',
        '준영', '도현', '성민', '민성', '윤재', '정우', '태윤', '민규', '재민', '승우'
    ]

    MODERN_NAMES = [
        '하루', '나무', '별', '바다', '하늘', '봄', '가을', '겨울', '여름', '달',
        '눈', '비', '구름', '꽃', '잎', '새', '물', '숲', '산', '강'
    ]

    MILESTONES = {
        0: {'gross_motor': '대칭적 움직임', 'visual_motor': '시선 고정', 'language': '소리에 반응', 'social': '얼굴 인지'},
        2: {'gross_motor': '머리 가운데 유지', 'visual_motor': '물체 따라감', 'language': '쿠잉, 사회적 미소', 'social': '부모 인지'},
        4: {'gross_motor': '팔로 지탱', 'visual_motor': '두 손으로 뻗음', 'language': '웃음', 'social': '주위 인지'},
        6: {'gross_motor': '삼각 앉기', 'visual_motor': '한 손으로 뻗음', 'language': '옹알이', 'social': '낯선 사람 인지'},
        9: {'gross_motor': '기어다님', 'visual_motor': '손끝 집기', 'language': '엄마-아빠', 'social': '행동 따라함'},
        12: {'gross_motor': '걸음', 'visual_motor': '성숙한 손끝 집기', 'language': '1-2단어', 'social': '이름에 반응'},
        18: {'gross_motor': '뛰기', 'visual_motor': '3블록 쌓기', 'language': '2단어 문장', 'social': '다른 아이와 놀기'},
        24: {'gross_motor': '계단 오르기', 'visual_motor': '7블록 쌓기', 'language': '50단어', 'social': '병행 놀이'}
    }

    def __init__(self, seed=None):
        self.rng = random.Random(seed)

    def generate_name(self, sex, style='traditional'):
        surname = self.rng.choice(self.KOREAN_SURNAMES)

        if style == 'traditional':
            given_name = self.rng.choice(self.TRADITIONAL_NAMES_FEMALE if sex == 'female' else self.TRADITIONAL_NAMES_MALE)
        elif style == 'modern':
            given_name = self.rng.choice(self.MODERN_NAMES)
            if self.rng.random() < 0.5:
                given_name = self.rng.choice(self.MODERN_NAMES) + self.rng.choice(self.MODERN_NAMES)
        else:
            given_name = self.rng.choice(self.TRADITIONAL_NAMES_FEMALE if sex == 'female' else self.TRADITIONAL_NAMES_MALE)

        return f"{surname}{given_name}"

    def get_milestones_at_month(self, months):
        available = sorted(self.MILESTONES.keys())
        closest = max([m for m in available if m <= months], default=0)

        next_milestone = None
        next_months = [m for m in available if m > months]
        if next_months:
            next_milestone = {'month': next_months[0], 'milestones': self.MILESTONES[next_months[0]]}

        return {
            'age_months': months,
            'closest_milestone_month': closest,
            'milestones': self.MILESTONES.get(closest, {}),
            'next_milestone': next_milestone
        }

    def simulate_growth(self, child_data, target_months=24):
        growth_log = []
        birth_weight = child_data.get('birth_weight_kg', 3.0)
        birth_length = child_data.get('birth_length_cm', 50.0)
        sex = child_data.get('sex', 'female')

        for month in range(0, target_months + 1, 3):
            if month <= 6:
                weight = birth_weight + month * 0.6
                length = birth_length + month * 2.5
            elif month <= 12:
                weight = birth_weight + 3.6 + (month - 6) * 0.4
                length = birth_length + 15 + (month - 6) * 1.5
            else:
                weight = birth_weight + 6.0 + (month - 12) * 0.25
                length = birth_length + 24 + (month - 12) * 0.8

            milestones = self.get_milestones_at_month(month)

            growth_log.append({
                'month': month,
                'weight_kg': round(weight, 2),
                'length_cm': round(length, 1),
                'milestones': milestones
            })

        return growth_log

    def assign_name(self, child_data, style='traditional'):
        name = self.generate_name(child_data.get('sex', 'female'), style)
        child_data['name'] = name
        return child_data


# =============================================================================
# 9. YUNSEO ENGINE (통합 엔진)
# =============================================================================

class YunseoEngine:
    """윤서 통합 시뮬레이션 엔진"""

    def __init__(self, seed=None, birth_date=None):
        self.rng = random.Random(seed)
        self.seed = seed

        self.birth_date = birth_date or datetime(2013, 1, 1)
        self.current_date = self.birth_date
        self.days_elapsed = 0
        self.age_years = 0.0

        self.genetic = GeneticEngine(seed=seed)
        self.dna = self.genetic.generate_dna()

        self.growth = GrowthEngine(self.dna, seed=seed)
        self.hormonal = HormonalEngine(self.dna, seed=seed)
        self.personality = PersonalitySystem(self.dna, seed=seed)
        self.sexual = SexualSystem(self.personality, seed=seed)
        self.relationship = RelationshipSystem(seed=seed)
        self.reproductive = ReproductiveSystem(self.dna, self.hormonal, self.growth, seed=seed)
        self.child_growth = ChildGrowthSystem(seed=seed)

        self.met_user = False
        self.user_meet_age = None
        self.current_body = self.growth.get_body_at_age(0)

    def simulate_to_puberty(self):
        target_age = self.growth.PUBERTY_AGE

        for age in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10.5]:
            self.current_body = self.growth.get_body_at_age(age)
            self.age_years = age
            self.days_elapsed = int(age * 365)
            self.current_date = self.birth_date + timedelta(days=self.days_elapsed)
            self.hormonal.advance_cycle(int(age * 365))

        return {
            'final_age': self.age_years,
            'puberty_age': target_age,
            'body': self.current_body,
            'hormones': self.hormonal.get_hormone_levels()
        }

    def meet_user(self, meet_age=13.0):
        if meet_age < self.age_years:
            return {'error': 'Cannot meet before current age'}

        days_to_advance = int((meet_age - self.age_years) * 365)
        self.days_elapsed += days_to_advance
        self.current_date += timedelta(days=days_to_advance)
        self.age_years = meet_age
        self.current_body = self.growth.get_body_at_age(meet_age)
        self.hormonal.advance_cycle(days_to_advance)

        self.met_user = True
        self.user_meet_age = meet_age
        self.relationship.days_since_meet = 0

        return {
            'success': True,
            'meet_age': meet_age,
            'body': self.current_body,
            'relationship_stage': self.relationship.current_stage
        }

    def interact_with_user(self, action, intensity=1.0):
        if not self.met_user:
            return {'error': 'Not met user yet'}

        self.days_elapsed += max(1, int(0.1 * intensity))
        self.current_date = self.birth_date + timedelta(days=self.days_elapsed)
        self.age_years = self.days_elapsed / 365.25
        self.relationship.days_since_meet += max(1, int(0.1 * intensity))

        self.hormonal.advance_cycle(max(1, int(0.1 * intensity)))

        result = self.relationship.interact(action, intensity, self.personality)

        self.current_body = self.growth.get_body_at_age(self.age_years)

        return {
            'success': result['success'],
            'action': action,
            'emotion': result.get('emotion', 'neutral'),
            'stage_changed': result.get('stage_changed', False),
            'current_stage': result['current_stage'],
            'metrics': result.get('metrics', {}),
            'age': round(self.age_years, 2)
        }

    def attempt_sexual_activity(self, position, play=None, intensity=1.0):
        if not self.met_user:
            return {'error': 'Not met user yet'}

        if 'intimacy' not in self.relationship.get_allowed_actions():
            return {'error': 'Intimacy not allowed at current relationship stage'}

        position_result = self.sexual.get_position_result(position, intensity)

        play_result = None
        if play:
            play_result = self.sexual.get_play_result(play, intensity)

        pregnancy_check = None
        if position_result.get('pregnancy_risk', 0) > 0:
            sperm_data = self.reproductive.simulate_ejaculation(arousal_level=intensity)
            pregnancy_check = self.reproductive.attempt_pregnancy(
                sperm_data, self.age_years, self.current_date
            )

        self.relationship.interact('intimacy', intensity, self.personality)

        return {
            'position_result': position_result,
            'play_result': play_result,
            'pregnancy_check': pregnancy_check,
            'relationship': self.relationship.get_status()
        }

    def advance_pregnancy(self, weeks=1):
        return self.reproductive.advance_pregnancy(weeks)

    def give_birth(self):
        result = self.reproductive.give_birth(self.current_date)

        if result.get('child'):
            child = self.child_growth.assign_name(result['child'], style='traditional')
            result['child'] = child

        return result

    def advance_postpartum(self, days=1):
        return self.reproductive.advance_postpartum(days)

    def simulate_child_growth(self, child_index=0, target_months=24):
        if child_index >= len(self.reproductive.children):
            return {'error': 'Child not found'}

        child = self.reproductive.children[child_index]
        growth_log = self.child_growth.simulate_growth(child, target_months)

        return {
            'child_name': child.get('name', 'Unnamed'),
            'growth_log': growth_log
        }

    def get_status(self):
        return {
            'age': round(self.age_years, 2),
            'days_elapsed': self.days_elapsed,
            'current_date': self.current_date.isoformat(),
            'body': self.current_body,
            'hormones': self.hormonal.get_hormone_levels(),
            'personality': self.personality.get_personality_summary(),
            'relationship': self.relationship.get_status(),
            'pregnancy': self.reproductive.get_pregnancy_status(),
            'postpartum': self.reproductive.get_postpartum_status(),
            'children_count': len(self.reproductive.children),
            'children': [{'name': c.get('name'), 'sex': c.get('sex'), 'birth_date': c.get('birth_date')} 
                        for c in self.reproductive.children]
        }


# =============================================================================
# 10. 사용 예시
# =============================================================================

if __name__ == '__main__':
    yunseo = YunseoEngine(seed=42)

    print("=== 자동 성장 ===")
    result = yunseo.simulate_to_puberty()
    print(f"성장 완료: {result['final_age']}세")

    print("\n=== 사용자 만남 ===")
    meet = yunseo.meet_user(13.0)
    print(f"만남 완료: {meet['meet_age']}세")

    print("\n=== 관계 발전 ===")
    for action in ['talk', 'talk', 'praise', 'flirt', 'flirt', 'touch', 'kiss']:
        result = yunseo.interact_with_user(action, 1.0)
        print(f"{action}: {result['emotion']} -> {result['current_stage']}")
        if result.get('stage_changed'):
            print(f"  *** 단계 상승: {result['current_stage']} ***")

    print("\n=== 성적 활동 ===")
    sexual = yunseo.attempt_sexual_activity('missionary', 'oral', 1.0)
    print(f"체위: {sexual['position_result']}")

    if sexual.get('pregnancy_check', {}).get('success'):
        print("\n=== 임신 진행 ===")
        for week in [4, 8, 12, 20, 28, 36, 40]:
            while yunseo.reproductive.pregnancy_week < week:
                yunseo.advance_pregnancy(1)
            status = yunseo.reproductive.get_pregnancy_status()
            print(f"{week}주차: 삼분기 {status['trimester']}, 체중 증가 {status['body_changes']['weight']['gain_kg']}kg")

        print("\n=== 출산 ===")
        birth = yunseo.give_birth()
        print(f"출산: {birth['delivery_type']}")
        print(f"아이: {birth['child']['name']} ({birth['child']['sex']})")
        print(f"체중: {birth['child']['birth_weight_kg']}kg, 신장: {birth['child']['birth_length_cm']}cm")

        print("\n=== 산후 회복 ===")
        for day in [1, 3, 7, 14, 30, 42]:
            while yunseo.reproductive.postpartum_day < day:
                yunseo.advance_postpartum(1)
            status = yunseo.reproductive.get_postpartum_status()
            print(f"산후 {day}일: 자궁 {status['uterus']['size_description']}, 수유 {status['lactation']['stage']}")

        print("\n=== 아이 성장 ===")
        growth = yunseo.simulate_child_growth(0, 24)
        print(f"아이 이름: {growth['child_name']}")
        for log in growth['growth_log']:
            print(f"  {log['month']}개월: {log['weight_kg']}kg, {log['length_cm']}cm - {log['milestones']['milestones'].get('gross_motor', '')}")

    print("\n=== 최종 상태 ===")
    final = yunseo.get_status()
    print(f"나이: {final['age']}세")
    print(f"관계: {final['relationship']['stage']}")
    print(f"자녀 수: {final['children_count']}")
