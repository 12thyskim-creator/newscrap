# Newscrap

로컬에서 실행하는 뉴스 스크랩북 프로토타입입니다. Supabase 환경변수가 없으면 로컬 데모 로그인을 사용하고, 환경변수를 넣으면 Supabase Auth와 계정별 저장 기능을 사용합니다.

## Run locally

Node.js 20.9 이상이 필요합니다.

```powershell
npm --prefix newscrap-app run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 데모 모드에서는 이메일과 6자 이상 비밀번호를 입력하면 됩니다. 데모 계정별 데이터는 현재 브라우저의 `localStorage`에 저장됩니다.

## Supabase setup

1. Supabase 프로젝트를 만들고 Project URL과 publishable/anon key를 확인합니다.
2. `newscrap-app/.env.example`을 복사해 `newscrap-app/.env.local`을 만들고 값을 입력합니다.
3. Supabase SQL Editor에서 `newscrap-app/supabase/schema.sql`을 실행합니다.
4. 개발 서버를 다시 시작하고 회원가입합니다. 이메일 확인이 활성화된 경우, 확인 메일을 인증한 뒤 로그인합니다.

브라우저에는 공개 가능한 Supabase anon key만 사용합니다. `service_role` 키는 클라이언트 환경변수에 넣지 마세요. 폴더와 저장 기사는 RLS 정책으로 로그인한 소유자에게만 노출됩니다.

## Folder insight setup

1. Google AI Studio에서 Gemini API key를 발급합니다.
2. `newscrap-app/.env.local`에 `GEMINI_API_KEY`를 추가합니다. 이 키는 `NEXT_PUBLIC_` 접두사를 붙이지 말고 서버에서만 사용합니다.
3. `GEMINI_MODEL` 기본값은 `gemini-3.8-flash`입니다. 모델을 바꾸려면 같은 파일에서 값을 지정할 수 있습니다.
4. Supabase SQL Editor에서 최신 `newscrap-app/supabase/schema.sql`을 다시 실행하고 개발 서버를 재시작합니다.

마이스크랩의 폴더 상단에서 하루 한 번 AI 흐름 요약을 생성합니다. 생성 결과와 근거 기사 ID는 폴더·날짜별로 Supabase에 저장되며 같은 날 재방문 시 재사용합니다. 입력으로 보내는 것은 저장 기사에 대한 Newscrap의 짧은 구조화 요약뿐이며 기사 전문은 전송하지 않습니다. Gemini 무료 티어 요청 데이터는 Google 제품 개선에 사용될 수 있으니 개인정보나 민감한 내용을 넣지 마세요. 무료 사용량과 데이터 정책은 변경될 수 있습니다.

## Prototype scope

- 매일경제 A1~A20 지면의 날짜별 샘플 기사 10개, 2026년 9월 21~23일
- 오늘의 스크랩: 날짜 선택, 페이지당 5개, 고정 구조화 요약
- 마이스크랩: 폴더 생성, 여러 폴더에 기사 저장, 폴더별 열람
- 폴더별 하루 1회 저장 스크랩 AI 흐름 요약, 질문형 챗봇은 제외
- 기사 전문은 보관하지 않고 매일경제 원문 링크로 연결

요약과 샘플 데이터는 프로토타입용입니다. 기사 원문을 대체하지 않습니다.
