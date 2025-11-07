import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MapPin, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hotel {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
}

interface HotelSearchProps {
  value?: Hotel | null;
  onSelect: (hotel: Hotel | null) => void;
  placeholder?: string;
  className?: string;
}

// Google Places API를 사용한 호텔 검색
// 주의: 브라우저에서 직접 호출하면 CORS 오류가 발생합니다.
// 프로덕션에서는 서버 사이드 프록시를 사용하거나 Google Places JavaScript SDK를 사용해야 합니다.
const searchHotels = async (query: string): Promise<Hotel[]> => {
  if (!query.trim()) return [];

  // 현재는 CORS 문제로 인해 더미 데이터만 사용
  // TODO: 서버 사이드 프록시 또는 Google Places JavaScript SDK로 전환 필요
  return getDummyHotels(query);

  /* 
  // 서버 사이드 프록시를 사용하는 경우 아래 코드 사용:
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return getDummyHotels(query);
    }

    // 서버 사이드 프록시를 통해 호출
    const response = await fetch(
      `/api/places/search?query=${encodeURIComponent(query + " 호텔")}&type=lodging`
    );

    if (!response.ok) {
      throw new Error("호텔 검색에 실패했습니다");
    }

    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: place.geometry,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
      }));
    }

    return [];
  } catch (error) {
    // 오류 발생 시 더미 데이터 반환
    return getDummyHotels(query);
  }
  */
};

// 더미 호텔 데이터 (개발 및 테스트용)
const getDummyHotels = (query: string): Hotel[] => {
  const dummyHotels: Hotel[] = [
    {
      place_id: "dummy1",
      name: "서울 그랜드 호텔",
      formatted_address: "서울특별시 중구 세종대로 123",
      rating: 4.5,
      user_ratings_total: 1234,
    },
    {
      place_id: "dummy2",
      name: "롯데 호텔 서울",
      formatted_address: "서울특별시 중구 을지로 30",
      rating: 4.8,
      user_ratings_total: 2345,
    },
    {
      place_id: "dummy3",
      name: "신라 호텔",
      formatted_address: "서울특별시 중구 동호로 249",
      rating: 4.7,
      user_ratings_total: 3456,
    },
    {
      place_id: "dummy4",
      name: "콘래드 서울",
      formatted_address: "서울특별시 영등포구 국제금융로 10",
      rating: 4.6,
      user_ratings_total: 1567,
    },
    {
      place_id: "dummy5",
      name: "파크 하얏트 서울",
      formatted_address: "서울특별시 강남구 테헤란로 606",
      rating: 4.4,
      user_ratings_total: 987,
    },
    {
      place_id: "dummy6",
      name: "그랜드 하얏트 서울",
      formatted_address: "서울특별시 용산구 소월로 322",
      rating: 4.6,
      user_ratings_total: 2100,
    },
    {
      place_id: "dummy7",
      name: "JW 메리어트 호텔 서울",
      formatted_address: "서울특별시 서초구 신반포로 176",
      rating: 4.7,
      user_ratings_total: 1890,
    },
    {
      place_id: "dummy8",
      name: "포시즌스 호텔 서울",
      formatted_address: "서울특별시 종로구 새문안로 97",
      rating: 4.9,
      user_ratings_total: 3200,
    },
  ];

  // 쿼리가 비어있으면 모든 호텔 반환
  if (!query.trim()) {
    return dummyHotels;
  }

  // 쿼리로 필터링 (호텔명 또는 주소에 포함된 경우)
  const lowerQuery = query.toLowerCase();
  return dummyHotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(lowerQuery) ||
    hotel.formatted_address.toLowerCase().includes(lowerQuery)
  );
};

export const HotelSearch = ({
  value,
  onSelect,
  placeholder = "호텔 검색...",
  className,
}: HotelSearchProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Popover가 열릴 때 초기 검색 결과 로드
  useEffect(() => {
    if (open && searchQuery.trim().length === 0) {
      // Popover가 열리고 검색어가 없을 때 모든 호텔 표시
      const results = getDummyHotels("");
      setHotels(results);
    }
  }, [open]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length < 2) {
      // 2글자 미만일 때는 모든 호텔 표시
      if (open) {
        const results = getDummyHotels("");
        setHotels(results);
      } else {
        setHotels([]);
      }
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchHotels(searchQuery);
      setHotels(results);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, open]);

  const handleSelect = (hotel: Hotel) => {
    onSelect(hotel);
    setOpen(false);
    setSearchQuery("");
    setHotels([]);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
    setHotels([]);
  };

  return (
    <Popover 
      open={open} 
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          // Popover가 닫힐 때 검색어 초기화
          setSearchQuery("");
          setHotels([]);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rounded-xl",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {value ? value.name : placeholder}
            </span>
          </div>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              ×
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="호텔명 또는 주소로 검색..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : hotels.length === 0 ? (
              <CommandEmpty>
                {searchQuery.trim().length < 2
                  ? "2글자 이상 입력해주세요"
                  : "검색 결과가 없습니다"}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {hotels.map((hotel) => (
                  <CommandItem
                    key={hotel.place_id}
                    value={hotel.place_id}
                    onSelect={() => handleSelect(hotel)}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value?.place_id === hotel.place_id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{hotel.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {hotel.formatted_address}
                        </div>
                        {hotel.rating && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ⭐ {hotel.rating.toFixed(1)}
                            {hotel.user_ratings_total &&
                              ` (${hotel.user_ratings_total.toLocaleString()}개 리뷰)`}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

