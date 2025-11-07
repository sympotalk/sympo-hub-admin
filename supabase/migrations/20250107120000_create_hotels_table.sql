-- Hotels Table for storing hotel data
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2),
  user_ratings_total INTEGER DEFAULT 0,
  place_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Create index for search performance
CREATE INDEX idx_hotels_name ON public.hotels(name);
CREATE INDEX idx_hotels_address ON public.hotels(formatted_address);

-- RLS Policy: Everyone can read hotels (no authentication required for search)
CREATE POLICY "Anyone can read hotels"
  ON public.hotels FOR SELECT
  USING (true);

-- Updated_at trigger
CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial hotel data
INSERT INTO public.hotels (name, formatted_address, latitude, longitude, rating, user_ratings_total, place_id) VALUES
('서울 그랜드 호텔', '서울특별시 중구 세종대로 123', 37.5665, 126.9780, 4.5, 1234, 'dummy1'),
('롯데 호텔 서울', '서울특별시 중구 을지로 30', 37.5645, 126.9770, 4.8, 2345, 'dummy2'),
('신라 호텔', '서울특별시 중구 동호로 249', 37.5555, 127.0055, 4.7, 3456, 'dummy3'),
('콘래드 서울', '서울특별시 영등포구 국제금융로 10', 37.5255, 126.9265, 4.6, 1567, 'dummy4'),
('파크 하얏트 서울', '서울특별시 강남구 테헤란로 606', 37.5275, 127.0405, 4.4, 987, 'dummy5'),
('그랜드 하얏트 서울', '서울특별시 용산구 소월로 322', 37.5455, 126.9945, 4.6, 2100, 'dummy6'),
('JW 메리어트 호텔 서울', '서울특별시 서초구 신반포로 176', 37.5045, 127.0045, 4.7, 1890, 'dummy7'),
('포시즌스 호텔 서울', '서울특별시 종로구 새문안로 97', 37.5665, 126.9780, 4.9, 3200, 'dummy8'),
('안다즈 서울 강남', '서울특별시 강남구 테헤란로 152', 37.5275, 127.0405, 4.8, 2800, 'dummy9'),
('소피텔 앰버서더 서울', '서울특별시 중구 소공로 135', 37.5645, 126.9770, 4.6, 1650, 'dummy10'),
('웨스틴 조선 서울', '서울특별시 중구 소공로 106', 37.5645, 126.9770, 4.7, 1950, 'dummy11'),
('인터컨티넨탈 서울 코엑스', '서울특별시 강남구 봉은사로 524', 37.5125, 127.0595, 4.5, 1420, 'dummy12'),
('노보텔 앰버서더 강남', '서울특별시 강남구 테헤란로 152', 37.5275, 127.0405, 4.5, 1200, 'dummy13'),
('힐튼 서울', '서울특별시 중구 남대문로 81', 37.5645, 126.9770, 4.6, 1800, 'dummy14'),
('리츠칼튼 서울', '서울특별시 강남구 테헤란로 152', 37.5275, 127.0405, 4.8, 2500, 'dummy15');

