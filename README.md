# 윤서 (Yunseo) - 생활 시뮬레이션 PWA

> 대한민국 7차 인체치수조사 기반 여성 성장 시뮬레이션

## 프로젝트 구조

```
Yoonseo/
├── engine/
│   └── yunseo_engine.py          # Python 시뮬레이션 엔진 (원본)
├── frontend/
│   ├── index.html                # PWA 메인 페이지
│   ├── app.js                    # 프론트엔드 로직
│   ├── styles.css                # 스타일시트
│   ├── sw.js                     # Service Worker
│   ├── manifest.json             # PWA 매니페스트
│   └── vercel.json               # Vercel 설정
├── api/
│   └── index.js                  # Vercel Serverless API (JS 포팅 엔진)
├── .github/
│   └── workflows/
│       └── deploy.yml            # 자동 배포 설정
└── README.md
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML5 / CSS3 / Vanilla JS |
| 백엔드 | Vercel Serverless Functions |
| 배포 | Vercel + GitHub Actions |
| PWA | Service Worker + Web App Manifest |

## 시뮬레이션 시스템

- **유전 엔진**: 부모 DNA -> 자녀 DNA, 돌연변이 1%
- **성장 엔진**: 0~19세 대한민국 평균 신체 데이터
- **호륜 엔진**: 에스트로겐/프로게스테론/테스토스테론 + 임신 중 hCG/릴텍신
- **성격 시스템**: Big Five + 성적 특성
- **성적 시스템**: 16체위, 15개 성감대
- **관계 시스템**: 7단계 (stranger -> spouse)
- **생식 시스템**: 임신/출산/산후/수유 상세 메커니즘
- **아이 성장**: 이름 생성 + 0~24개월 발달 이정표

## API 엔드포인트

```
POST /api/init              -> 세션 생성
POST /api/interact          -> 상호작용
POST /api/stimulate         -> 성감대 자극
POST /api/advance           -> 시간 진행
POST /api/sexual-activity   -> 성적 활동
POST /api/pregnancy/advance -> 임신 진행
POST /api/pregnancy/birth   -> 출산
POST /api/postpartum/advance-> 산후 진행
POST /api/child/growth      -> 아이 성장 시뮬
GET  /api/status            -> 상태 조회
```

## 로컬 개발

```bash
# 프론트엔드
npm install -g vercel
vercel dev

# Python 엔진 테스트
cd engine
python yunseo_engine.py
```

## 배포

GitHub push 시 자동으로 Vercel에 배포됩니다.

필요한 Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 라이선스

MIT
