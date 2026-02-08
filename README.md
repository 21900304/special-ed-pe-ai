# 특수학급 AI 체육 수업 플랫폼

## 프로젝트 개요

웹캠으로 특수학급 학생들의 동작을 실시간 추적하여 TV 화면에 캐릭터로 표시하고, AI가 자동으로 스쿼트 운동 횟수를 카운팅하는 PWA 프로토타입입니다.

## 설치 방법

```bash
bun install
```

## 실행 방법

```bash
bun run dev
```

## 기술 스택

- **프레임워크**: Vite + React 18 + TypeScript
- **스타일링**: TailwindCSS
- **포즈 추정**: TensorFlow.js + MoveNet MultiPose Lightning
- **렌더링**: Canvas 2D API
- **패키지 매니저**: bun

## 디렉토리 구조

```
src/
├── components/     # React 컴포넌트
├── hooks/          # 커스텀 훅 (웹캠, MoveNet, 카운팅)
├── utils/          # 유틸리티 함수
└── types/          # TypeScript 타입 정의
```

## 라이선스

MIT License
