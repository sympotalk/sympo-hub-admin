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
import { supabase } from "@/integrations/supabase/client";

interface Hotel {
  id: string;
  place_id: string | null;
  name: string;
  formatted_address: string;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  user_ratings_total?: number | null;
}

interface HotelSearchProps {
  value?: Hotel | null;
  onSelect: (hotel: Hotel | null) => void;
  placeholder?: string;
  className?: string;
}

// Supabase에서 호텔 검색
const searchHotels = async (query: string): Promise<Hotel[]> => {
  try {
    let queryBuilder = supabase
      .from("hotels")
      .select("*")
      .order("name", { ascending: true });

    if (query.trim()) {
      // 검색어가 있으면 이름이나 주소에서 검색
      const searchTerm = query.trim();
      queryBuilder = queryBuilder.or(
        `name.ilike.%${searchTerm}%,formatted_address.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await queryBuilder.limit(50);

    if (error) {
      console.error("호텔 검색 오류:", error);
      return [];
    }

    // Hotel 인터페이스에 맞게 변환
    return (data || []).map((hotel: any) => ({
      id: hotel.id,
      place_id: hotel.place_id || hotel.id,
      name: hotel.name,
      formatted_address: hotel.formatted_address,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      rating: hotel.rating ? Number(hotel.rating) : null,
      user_ratings_total: hotel.user_ratings_total || null,
    }));
  } catch (error) {
    console.error("호텔 검색 오류:", error);
    return [];
  }
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
      searchHotels("").then((results) => {
        setHotels(results);
      });
    }
  }, [open]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (!open) {
      // Popover가 닫혀있으면 검색하지 않음
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length === 0) {
      // 검색어가 없을 때는 모든 호텔 표시
      searchHotels("").then((results) => {
        setHotels(results);
      });
      return;
    }

    if (searchQuery.trim().length < 2) {
      // 1글자일 때는 빈 결과 표시
      setHotels([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchHotels(searchQuery.trim());
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
            <div
              className="h-6 w-6 p-0 shrink-0 flex items-center justify-center rounded-sm hover:bg-accent cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear();
                }
              }}
            >
              ×
            </div>
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
                    key={hotel.id}
                    value={hotel.id}
                    onSelect={() => handleSelect(hotel)}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value?.id === hotel.id || value?.place_id === hotel.place_id
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

