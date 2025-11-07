# 호텔 데이터 크롤링 스크립트

국내 5성급 호텔 데이터를 Google Places API를 사용하여 수집하고 Supabase에 저장하는 스크립트입니다.

## 설치

```bash
pip install -r requirements.txt
```

## 환경 변수 설정

**자세한 설정 방법은 `ENV_SETUP_GUIDE.md` 파일을 참고하세요!**

프로젝트 루트 디렉토리 (`c:\sympohubv2\sympo-hub-admin\`)에 `.env` 파일을 생성하거나 기존 파일에 다음 변수를 추가하세요:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
SUPABASE_URL=https://rpgexqqghswbxiomrads.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**중요**: 
- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 대시보드의 "Settings > API > service_role" 키를 사용해야 합니다
- 값에는 따옴표를 사용하지 않습니다
- `=` 앞뒤로 공백이 없어야 합니다

## 실행

```bash
python crawl_hotels.py
```

## 주요 기능

- 14개 주요 도시에서 5성급 호텔 검색
- Google Places API를 사용한 호텔 정보 수집
- 중복 제거 (place_id 기준)
- Supabase에 자동 삽입 (upsert 사용)
- JSON 파일로 백업 저장

## 수집되는 정보

- 호텔명
- 주소
- 위도/경도
- 평점
- 리뷰 수
- Google Places ID

