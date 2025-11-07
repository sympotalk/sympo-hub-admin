# 환경 변수 설정 가이드

## 📍 .env 파일 위치

`.env` 파일은 **프로젝트 루트 디렉토리** (`c:\sympohubv2\sympo-hub-admin\`)에 있어야 합니다.

## 📝 .env 파일에 추가할 내용

기존 `.env` 파일이 있다면, 아래 내용을 **파일 끝에 추가**하세요. 없다면 새로 생성하세요.

```env
# Google Places API 키 (호텔 크롤링용)
GOOGLE_PLACES_API_KEY=여기에_실제_API_키_입력

# Supabase 설정 (크롤링 스크립트에서 사용)
SUPABASE_URL=https://rpgexqqghswbxiomrads.supabase.co
SUPABASE_SERVICE_ROLE_KEY=여기에_Service_Role_키_입력
```

## 🔑 각 환경 변수 설명

### 1. GOOGLE_PLACES_API_KEY
- **용도**: Google Places API를 사용하여 호텔 정보를 크롤링할 때 사용
- **어디서 얻나요?**
  1. [Google Cloud Console](https://console.cloud.google.com/) 접속
  2. 프로젝트 선택 또는 새 프로젝트 생성
  3. "API 및 서비스" > "라이브러리"에서 "Places API" 활성화
  4. "API 및 서비스" > "사용자 인증 정보"에서 API 키 생성
  5. 생성된 API 키를 복사하여 `GOOGLE_PLACES_API_KEY=` 뒤에 붙여넣기

### 2. SUPABASE_URL
- **용도**: Supabase 데이터베이스 URL
- **현재 값**: `https://rpgexqqghswbxiomrads.supabase.co` (이미 프로젝트에 설정됨)
- **참고**: `src/integrations/supabase/client.ts` 파일에서 확인 가능

### 3. SUPABASE_SERVICE_ROLE_KEY
- **용도**: Supabase에 데이터를 삽입할 때 필요한 관리자 권한 키
- **중요**: 이 키는 **Service Role Key**여야 합니다 (일반 anon key가 아님)
- **어디서 얻나요?**
  1. [Supabase 대시보드](https://app.supabase.com/) 접속
  2. 프로젝트 선택
  3. 왼쪽 메뉴에서 "Settings" (설정) 클릭
  4. "API" 섹션으로 이동
  5. "Project API keys" 섹션에서 **"service_role"** 키 찾기
  6. 키 옆의 "Reveal" 버튼 클릭하여 키 확인
  7. 복사한 키를 `SUPABASE_SERVICE_ROLE_KEY=` 뒤에 붙여넣기

## ⚠️ 주의사항

1. **따옴표 없이 입력**: 환경 변수 값에는 따옴표를 사용하지 않습니다
   - ✅ 올바른 예: `GOOGLE_PLACES_API_KEY=AIzaSyABC123...`
   - ❌ 잘못된 예: `GOOGLE_PLACES_API_KEY="AIzaSyABC123..."`

2. **공백 없이 입력**: `=` 앞뒤로 공백이 없어야 합니다
   - ✅ 올바른 예: `KEY=value`
   - ❌ 잘못된 예: `KEY = value` 또는 `KEY= value`

3. **.env 파일은 Git에 커밋하지 마세요**: 
   - `.env` 파일에는 민감한 정보가 포함되어 있으므로 Git에 커밋하면 안 됩니다
   - 이미 `.gitignore`에 포함되어 있는지 확인하세요

## 📋 .env 파일 예시

전체 `.env` 파일 예시:

```env
# 기존 환경 변수들 (있다면 그대로 유지)
VITE_SUPABASE_URL=https://rpgexqqghswbxiomrads.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 호텔 크롤링을 위한 새로운 환경 변수 추가
GOOGLE_PLACES_API_KEY=AIzaSyABC123def456ghi789jkl012mno345pqr
SUPABASE_URL=https://rpgexqqghswbxiomrads.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZ2V4cXFnaHN3Ynhpb21yYWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzMDI0MywiZXhwIjoyMDc4MDA2MjQzfQ.실제_서비스_롤_키
```

## ✅ 확인 방법

환경 변수가 제대로 설정되었는지 확인하려면:

1. **Windows PowerShell에서**:
   ```powershell
   cd c:\sympohubv2\sympo-hub-admin
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('GOOGLE_PLACES_API_KEY:', os.getenv('GOOGLE_PLACES_API_KEY')[:20] + '...' if os.getenv('GOOGLE_PLACES_API_KEY') else 'Not set')"
   ```

2. **크롤링 스크립트 실행 시**: 스크립트가 환경 변수를 읽어서 사용합니다.

## 🚀 다음 단계

환경 변수를 설정한 후:

1. Python 패키지 설치:
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

2. 크롤링 스크립트 실행:
   ```bash
   python crawl_hotels.py
   ```

