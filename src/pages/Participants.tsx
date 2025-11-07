import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Upload, RefreshCw } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  position: string | null;
}

const Participants = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.agency_id) {
      loadProjects();
    }
  }, [profile?.agency_id]);

  useEffect(() => {
    if (selectedProjectId) {
      loadParticipants();
    } else {
      setParticipants([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    if (!profile?.agency_id) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("agency_id", profile.agency_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("행사 목록을 불러오는데 실패했습니다");
    }
  };

  const loadParticipants = async () => {
    if (!selectedProjectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Failed to load participants:", error);
      toast.error("참가자 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["AGENCY"]}>
      <div className="min-h-screen bg-muted/30">
        <Navigation />

        <main className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">참가자 관리</h1>
                <p className="text-muted-foreground mt-1">
                  행사 참가자들을 관리하세요
                </p>
              </div>

              <Button className="rounded-xl gap-2 shadow-md hover:scale-[1.02] transition-all" disabled>
                <Upload className="w-4 h-4" />
                Excel 업로드
              </Button>
            </div>

            {/* Project Selection & Actions */}
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">행사 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="행사를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={loadParticipants}
                    disabled={!selectedProjectId}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Participants Table */}
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">참가자 목록</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    총 {participants.length}명
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedProjectId ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">행사를 선택해주세요</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      아직 등록된 참가자가 없습니다
                    </p>
                    <Button className="rounded-xl" disabled>
                      Excel로 참가자 추가
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>소속</TableHead>
                          <TableHead>직책</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>연락처</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">
                              {participant.full_name}
                            </TableCell>
                            <TableCell>{participant.organization || "-"}</TableCell>
                            <TableCell>{participant.position || "-"}</TableCell>
                            <TableCell>{participant.email || "-"}</TableCell>
                            <TableCell>{participant.phone || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Participants;
