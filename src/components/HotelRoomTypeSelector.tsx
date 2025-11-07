import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface RoomType {
  id: string;
  hotel_id: string;
  room_type_name: string;
  description: string | null;
  max_occupancy: number | null;
  bed_type: string | null;
  amenities: string[] | null;
  price_per_night: number | null;
}

interface HotelRoomTypeSelectorProps {
  hotelId: string | null;
  value?: string | null;
  onSelect: (roomTypeId: string | null) => void;
}

export const HotelRoomTypeSelector = ({
  hotelId,
  value,
  onSelect,
}: HotelRoomTypeSelectorProps) => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!hotelId) {
      setRoomTypes([]);
      onSelect(null);
      return;
    }

    loadRoomTypes();
  }, [hotelId]);

  const loadRoomTypes = async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      // 먼저 데이터베이스에서 객실 타입 조회
      const { data, error } = await supabase
        .from("hotel_room_types")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("room_type_name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setRoomTypes(data);
      } else {
        // 데이터베이스에 없으면 Google Places API에서 가져오기
        await fetchRoomTypesFromAPI();
      }
    } catch (error) {
      console.error("객실 타입 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypesFromAPI = async () => {
    if (!hotelId) return;

    setFetching(true);
    try {
      // 호텔 정보 가져오기
      const { data: hotel, error: hotelError } = await supabase
        .from("hotels")
        .select("place_id")
        .eq("id", hotelId)
        .single();

      if (hotelError || !hotel?.place_id) {
        console.error("호텔 정보를 찾을 수 없습니다");
        return;
      }

      // Google Places API Place Details 호출
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        console.error("Google Places API 키가 설정되지 않았습니다");
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hotel.place_id}&fields=name,formatted_address,types,editorial_summary&language=ko&key=${apiKey}`
      );

      const data = await response.json();

      if (data.status === "OK" && data.result) {
        // Place Details에서 객실 타입 정보 추출
        // 실제로는 Google Places API에서 직접 객실 타입을 제공하지 않으므로
        // 기본 객실 타입을 생성하거나, 호텔 웹사이트를 크롤링해야 함
        // 여기서는 기본 객실 타입을 생성
        const defaultRoomTypes = [
          {
            room_type_name: "스탠다드 룸",
            description: "기본 객실",
            max_occupancy: 2,
            bed_type: "더블베드",
            amenities: ["Wi-Fi", "TV", "에어컨"],
            price_per_night: null,
          },
          {
            room_type_name: "디럭스 룸",
            description: "디럭스 객실",
            max_occupancy: 2,
            bed_type: "킹베드",
            amenities: ["Wi-Fi", "TV", "에어컨", "미니바"],
            price_per_night: null,
          },
          {
            room_type_name: "스위트 룸",
            description: "스위트 객실",
            max_occupancy: 4,
            bed_type: "킹베드",
            amenities: ["Wi-Fi", "TV", "에어컨", "미니바", "거실"],
            price_per_night: null,
          },
        ];

        // 데이터베이스에 저장
        const insertData = defaultRoomTypes.map((roomType) => ({
          hotel_id: hotelId,
          ...roomType,
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from("hotel_room_types")
          .insert(insertData)
          .select();

        if (insertError) throw insertError;

        if (insertedData) {
          setRoomTypes(insertedData);
        }
      }
    } catch (error) {
      console.error("객실 타입 가져오기 오류:", error);
    } finally {
      setFetching(false);
    }
  };

  if (!hotelId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="room_type">객실 타입</Label>
      {loading || fetching ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>객실 타입을 불러오는 중...</span>
        </div>
      ) : (
        <Select value={value || undefined} onValueChange={onSelect}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="객실 타입을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                객실 타입이 없습니다
              </div>
            ) : (
              roomTypes.map((roomType) => (
                <SelectItem key={roomType.id} value={roomType.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{roomType.room_type_name}</span>
                    {roomType.description && (
                      <span className="text-xs text-muted-foreground">
                        {roomType.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

