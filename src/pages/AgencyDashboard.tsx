import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, MapPin, TrendingUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  participant_count?: number;
}

interface Stats {
  totalProjects: number;
  totalParticipants: number;
  activeProjects: number;
}

const AgencyDashboard = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalParticipants: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.agency_id) {
      loadDashboardData();
    }
  }, [profile?.agency_id]);

  const loadDashboardData = async () => {
    if (!profile?.agency_id) return;

    try {
      // Load recent projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("agency_id", profile.agency_id)
        .order("created_at", { ascending: false })
        .limit(6);

      // Load participant counts for each project
      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { count } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id);
          return { ...project, participant_count: count || 0 };
        })
      );

      setProjects(projectsWithCounts);

      // Calculate stats
      const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", profile.agency_id);

      const { count: totalParticipants } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", profile.agency_id);

      const { count: activeProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", profile.agency_id)
        .eq("status", "ONGOING");

      setStats({
        totalProjects: totalProjects || 0,
        totalParticipants: totalParticipants || 0,
        activeProjects: activeProjects || 0,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
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

  return (
    <ProtectedRoute allowedRoles={["AGENCY"]}>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                안녕하세요, {profile?.full_name}님
              </h1>
              <p className="text-muted-foreground">
                {profile?.organization}의 행사 현황을 확인하세요
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    총 행사 수
                  </CardTitle>
                  <Calendar className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    진행중 {stats.activeProjects}건
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    총 참가자 수
                  </CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalParticipants}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    전체 행사 기준
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    평균 참가자
                  </CardTitle>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {stats.totalProjects > 0
                      ? Math.round(stats.totalParticipants / stats.totalProjects)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    행사당 평균
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle>빠른 작업</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/projects">
                  <Button className="w-full rounded-xl gap-2 h-auto py-4 hover:scale-[1.02] transition-all">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">행사 관리</span>
                  </Button>
                </Link>
                <Link to="/participants">
                  <Button variant="outline" className="w-full rounded-xl gap-2 h-auto py-4 hover:scale-[1.02] transition-all">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">참가자 관리</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">최근 행사</h2>
                <Link to="/projects">
                  <Button variant="ghost" className="gap-2">
                    전체 보기
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : projects.length === 0 ? (
                <Card className="rounded-2xl shadow-card">
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">아직 등록된 행사가 없습니다</p>
                    <Link to="/projects">
                      <Button className="rounded-xl">첫 행사 등록하기</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card 
                      key={project.id} 
                      className="rounded-2xl shadow-card hover:shadow-card-hover transition-all group cursor-pointer"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                          {getStatusBadge(project.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(project.start_date), "yyyy.MM.dd", { locale: ko })} ~{" "}
                            {format(new Date(project.end_date), "yyyy.MM.dd", { locale: ko })}
                          </span>
                        </div>
                        {project.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{project.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>참가자 {project.participant_count}명</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AgencyDashboard;
