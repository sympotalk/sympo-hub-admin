"""
국내 5성급 호텔 데이터 크롤링 스크립트
Google Places API를 사용하여 국내 주요 도시의 5성급 호텔 정보를 수집합니다.
"""

import os
import json
import time
import requests
from typing import List, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
# 프로젝트 루트 디렉토리로 이동하여 .env 파일 찾기
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
env_path = os.path.join(project_root, ".env")
load_dotenv(env_path)

# 환경 변수에서 API 키 가져오기
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service role key 필요

# 주요 도시 및 검색어
CITIES = [
    "서울",
    "부산",
    "제주",
    "인천",
    "대구",
    "대전",
    "광주",
    "울산",
    "경주",
    "강릉",
    "여수",
    "전주",
    "춘천",
    "속초",
]

def search_hotels_in_city(city: str, api_key: str) -> List[Dict]:
    """특정 도시에서 5성급 호텔 검색"""
    hotels = []
    
    try:
        # Google Places API Text Search
        query = f"{city} 5성급 호텔"
        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "type": "lodging",
            "language": "ko",
            "key": api_key,
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get("status") == "OK" and "results" in data:
            for place in data["results"]:
                # 5성급 호텔만 필터링 (rating이 4.0 이상)
                if place.get("rating", 0) >= 4.0:
                    hotel = {
                        "name": place.get("name", ""),
                        "formatted_address": place.get("formatted_address", ""),
                        "latitude": place.get("geometry", {}).get("location", {}).get("lat"),
                        "longitude": place.get("geometry", {}).get("location", {}).get("lng"),
                        "rating": place.get("rating"),
                        "user_ratings_total": place.get("user_ratings_total", 0),
                        "place_id": place.get("place_id"),
                    }
                    hotels.append(hotel)
        
        # 다음 페이지가 있으면 추가 검색
        if "next_page_token" in data:
            time.sleep(2)  # API 제한을 위한 대기
            params["pagetoken"] = data["next_page_token"]
            response = requests.get(url, params=params)
            next_data = response.json()
            
            if next_data.get("status") == "OK" and "results" in next_data:
                for place in next_data["results"]:
                    if place.get("rating", 0) >= 4.0:
                        hotel = {
                            "name": place.get("name", ""),
                            "formatted_address": place.get("formatted_address", ""),
                            "latitude": place.get("geometry", {}).get("location", {}).get("lat"),
                            "longitude": place.get("geometry", {}).get("location", {}).get("lng"),
                            "rating": place.get("rating"),
                            "user_ratings_total": place.get("user_ratings_total", 0),
                            "place_id": place.get("place_id"),
                        }
                        hotels.append(hotel)
        
        time.sleep(1)  # API 제한 방지
        
    except Exception as e:
        print(f"Error searching hotels in {city}: {e}")
    
    return hotels

def get_all_hotels(api_key: str) -> List[Dict]:
    """모든 도시에서 호텔 수집"""
    all_hotels = []
    seen_place_ids = set()
    
    for city in CITIES:
        print(f"Searching hotels in {city}...")
        hotels = search_hotels_in_city(city, api_key)
        
        for hotel in hotels:
            # 중복 제거 (place_id 기준)
            if hotel.get("place_id") and hotel["place_id"] not in seen_place_ids:
                seen_place_ids.add(hotel["place_id"])
                all_hotels.append(hotel)
        
        print(f"Found {len(hotels)} hotels in {city}")
    
    return all_hotels

def insert_to_supabase(hotels: List[Dict], supabase: Client):
    """Supabase에 호텔 데이터 삽입"""
    # 기존 데이터 삭제 (선택사항)
    # supabase.table("hotels").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    # 배치로 삽입 (한 번에 100개씩)
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(hotels), batch_size):
        batch = hotels[i:i + batch_size]
        
        # Supabase 형식에 맞게 변환
        insert_data = []
        for hotel in batch:
            insert_data.append({
                "name": hotel["name"],
                "formatted_address": hotel["formatted_address"],
                "latitude": float(hotel["latitude"]) if hotel.get("latitude") else None,
                "longitude": float(hotel["longitude"]) if hotel.get("longitude") else None,
                "rating": float(hotel["rating"]) if hotel.get("rating") else None,
                "user_ratings_total": int(hotel["user_ratings_total"]) if hotel.get("user_ratings_total") else 0,
                "place_id": hotel.get("place_id"),
            })
        
        try:
            result = supabase.table("hotels").upsert(
                insert_data,
                on_conflict="place_id"
            ).execute()
            total_inserted += len(insert_data)
            print(f"Inserted {len(insert_data)} hotels (Total: {total_inserted})")
        except Exception as e:
            print(f"Error inserting batch: {e}")
            print(f"Failed batch: {json.dumps(insert_data[:2], ensure_ascii=False, indent=2)}")
    
    return total_inserted

def main():
    """메인 함수"""
    if not GOOGLE_PLACES_API_KEY:
        print("Error: GOOGLE_PLACES_API_KEY environment variable is not set")
        return
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are not set")
        return
    
    # Supabase 클라이언트 생성
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("Starting hotel crawling...")
    print(f"Searching in {len(CITIES)} cities...")
    
    # 모든 호텔 수집
    hotels = get_all_hotels(GOOGLE_PLACES_API_KEY)
    
    print(f"\nTotal hotels found: {len(hotels)}")
    
    # JSON 파일로 저장 (백업)
    with open("hotels_data.json", "w", encoding="utf-8") as f:
        json.dump(hotels, f, ensure_ascii=False, indent=2)
    print("Saved to hotels_data.json")
    
    # Supabase에 삽입
    print("\nInserting to Supabase...")
    total_inserted = insert_to_supabase(hotels, supabase)
    
    print(f"\n✅ Successfully inserted {total_inserted} hotels to Supabase!")

if __name__ == "__main__":
    main()

