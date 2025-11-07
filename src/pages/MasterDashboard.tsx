import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Calendar, UserCheck, Database, ShieldCheck, ArrowRight } from "lucide-react";

interface SystemStats {
  totalAgencies: number;
  totalUsers: number;
  totalProjects: number;
  totalParticipants: number;
}

const MasterDashboard = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalAgencies: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const [
        { count: totalAgencies },
        { count: totalUsers },
        { count: totalProjects },
        { count: totalParticipants },
      ] = await Promise.all([
        supabase.from("agencies").select("*", { count: "exact", head: true }),
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("participants").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalAgencies: totalAgencies || 0,
        totalUsers: totalUsers || 0,
        totalProjects: totalProjects || 0,
        totalParticipants: totalParticipants || 0,
      });
    } catch (error) {
      console.error("Failed to load system stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["MASTER"]}>
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                시스템 관리자 대시보드
              </h1>
              <p className="text-muted-foreground">
                SympoHub 전체 시스템 현황을 모니터링합니다
              </p>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    등록 에이전시
                  </CardTitle>
                  <Building2 className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalAgencies}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    전체 에이전시 수
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    사용자 수
                  </CardTitle>
                  <UserCheck className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    전체 사용자 수
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    행사 수
                  </CardTitle>
                  <Calendar className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    전체 행사 수
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    참가자 수
                  </CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalParticipants}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    전체 참가자 수
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Management Links */}
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle>시스템 관리</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/master/data">
                  <Button variant="outline" className="w-full rounded-xl gap-2 h-auto py-6 hover:scale-[1.02] transition-all justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-base">데이터 관리</div>
                        <div className="text-xs text-muted-foreground">
                          에이전시, 행사, 참가자 데이터 조회
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </Link>

                <Link to="/master/permissions">
                  <Button variant="outline" className="w-full rounded-xl gap-2 h-auto py-6 hover:scale-[1.02] transition-all justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-base">권한 관리</div>
                        <div className="text-xs text-muted-foreground">
                          사용자 권한 및 역할 관리
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="rounded-2xl shadow-card border-primary/20 bg-primary-light/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">읽기 전용 모드</h3>
                    <p className="text-sm text-muted-foreground">
                      MASTER 계정은 모든 데이터를 조회할 수 있지만, 수정 권한은 없습니다. 
                      데이터 변경이 필요한 경우 해당 에이전시 계정으로 작업해주세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default MasterDashboard;
