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
const searchHotels = async (query: string): Promise<Hotel[]> => {
  if (!query.trim()) return [];

  try {
    // Google Places API 사용 (API 키는 환경변수에서 가져옴)
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.warn("Google Places API 키가 설정되지 않았습니다.");
      // API 키가 없을 경우 더미 데이터 반환 (개발용)
      return getDummyHotels(query);
    }

    // Google Places API Text Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query + " 호텔"
      )}&type=lodging&language=ko&key=${apiKey}`
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
    console.error("호텔 검색 오류:", error);
    // 오류 발생 시 더미 데이터 반환
    return getDummyHotels(query);
  }
};

// API 키가 없을 때 사용할 더미 데이터
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
  ];

  // 쿼리로 필터링
  return dummyHotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(query.toLowerCase()) ||
    hotel.formatted_address.toLowerCase().includes(query.toLowerCase())
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

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length < 2) {
      setHotels([]);
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
  }, [searchQuery]);

  const handleSelect = (hotel: Hotel) => {
    onSelect(hotel);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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

