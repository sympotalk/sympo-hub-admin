import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Plus, Search, Pencil, Trash2, Hotel } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { HotelSearch } from "@/components/HotelSearch";
import { HotelRoomTypeSelector } from "@/components/HotelRoomTypeSelector";

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

interface Project {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  status: string;
  description: string | null;
  participant_count?: number;
  hotel?: Hotel | null;
}

const Projects = () => {
  const { profile, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.agency_id) {
      loadProjects();
    }
  }, [profile?.agency_id]);

  const loadProjects = async () => {
    if (!profile?.agency_id) return;

    try {
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("agency_id", profile.agency_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load participant counts and parse hotel data
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id);
          
          // Parse hotel data from location field if it's JSON
          let hotel: Hotel | null = null;
          if (project.location) {
            try {
              const parsed = JSON.parse(project.location);
              if (parsed.id || parsed.place_id) {
                hotel = parsed;
              }
            } catch {
              // Not JSON, keep as string location
            }
          }
          
          return { ...project, participant_count: count || 0, hotel };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("행사 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.agency_id || !user) {
      toast.error("사용자 정보를 찾을 수 없습니다");
      return;
    }

    try {
      // 호텔이 선택된 경우 JSON으로 저장, 아니면 일반 텍스트로 저장
      let locationValue: string | null = null;
      if (selectedHotel) {
        locationValue = JSON.stringify({
          ...selectedHotel,
          room_type_id: selectedRoomTypeId,
        });
      } else if (formData.location.trim()) {
        locationValue = formData.location.trim();
      }

      const { error } = await supabase.from("projects").insert([
        {
          agency_id: profile.agency_id,
          name: formData.name,
          location: locationValue,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description || null,
          status: "SCHEDULED",
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("행사가 등록되었습니다");
      setDialogOpen(false);
      setFormData({
        name: "",
        location: "",
        start_date: "",
        end_date: "",
        description: "",
      });
      setSelectedHotel(null);
      setSelectedRoomTypeId(null);
      loadProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("행사 등록에 실패했습니다");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("이 행사를 삭제하시겠습니까? 관련된 모든 참가자 정보도 함께 삭제됩니다.")) {
      return;
    }

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);

      if (error) throw error;

      toast.success("행사가 삭제되었습니다");
      loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("행사 삭제에 실패했습니다");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      SCHEDULED: { text: "예정", className: "bg-blue-100 text-blue-700" },
      ONGOING: { text: "진행중", className: "bg-green-100 text-green-700" },
      COMPLETED: { text: "완료", className: "bg-gray-100 text-gray-700" },
    };
    const badge = badges[status as keyof typeof badges] || badges.SCHEDULED;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={["AGENCY"]}>
      <div className="min-h-screen bg-muted/30">
        <Navigation />

        <main className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">행사 관리</h1>
                <p className="text-muted-foreground mt-1">
                  진행하는 행사들을 관리하세요
                </p>
              </div>

              <Dialog 
                open={dialogOpen} 
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    // 모달이 닫힐 때 상태 초기화
                    setFormData({
                      name: "",
                      location: "",
                      start_date: "",
                      end_date: "",
                      description: "",
                    });
                    setSelectedHotel(null);
                    setSelectedRoomTypeId(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button className="rounded-xl gap-2 shadow-md hover:scale-[1.02] transition-all">
                    <Plus className="w-4 h-4" />
                    행사 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleCreateProject}>
                    <DialogHeader>
                      <DialogTitle>새 행사 등록</DialogTitle>
                      <DialogDescription>
                        새로운 학술행사 정보를 입력하세요
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">행사명 *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hotel">호텔 검색</Label>
                        <HotelSearch
                          value={selectedHotel}
                          onSelect={(hotel) => {
                            setSelectedHotel(hotel);
                            setSelectedRoomTypeId(null); // 호텔 변경 시 객실 타입 초기화
                          }}
                          placeholder="호텔을 검색하여 선택하세요"
                        />
                      </div>
                      {selectedHotel && (
                        <HotelRoomTypeSelector
                          hotelId={selectedHotel.id}
                          value={selectedRoomTypeId}
                          onSelect={setSelectedRoomTypeId}
                        />
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="location">장소 (직접 입력)</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="호텔 검색을 사용하지 않는 경우 직접 입력"
                          className="rounded-xl"
                          disabled={!!selectedHotel}
                        />
                        {selectedHotel && (
                          <p className="text-xs text-muted-foreground">
                            호텔이 선택되어 있습니다. 직접 입력을 사용하려면 호텔 선택을 해제하세요.
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start_date">시작일 *</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                              setFormData({ ...formData, start_date: e.target.value })
                            }
                            required
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_date">종료일 *</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                              setFormData({ ...formData, end_date: e.target.value })
                            }
                            required
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="rounded-xl">
                        등록하기
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="행사명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card className="rounded-2xl shadow-card">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "검색 결과가 없습니다" : "아직 등록된 행사가 없습니다"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {format(new Date(project.start_date), "yyyy.MM.dd", { locale: ko })} ~{" "}
                            {format(new Date(project.end_date), "yyyy.MM.dd", { locale: ko })}
                          </span>
                        </div>
                        {project.hotel ? (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Hotel className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground line-clamp-1">
                                {project.hotel.name}
                              </div>
                              <div className="line-clamp-1 text-xs">
                                {project.hotel.formatted_address}
                              </div>
                              {project.hotel.rating && (
                                <div className="text-xs mt-0.5">
                                  ⭐ {project.hotel.rating.toFixed(1)}
                                  {project.hotel.user_ratings_total &&
                                    ` (${project.hotel.user_ratings_total.toLocaleString()})`}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : project.location ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{project.location}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>참가자 {project.participant_count}명</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-xl gap-2"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Projects;
