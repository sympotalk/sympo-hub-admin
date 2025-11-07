import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { LogOut, LayoutDashboard, Calendar, Users, Database, ShieldCheck } from "lucide-react";

const Navigation = () => {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("로그아웃에 실패했습니다");
    } else {
      toast.success("로그아웃되었습니다");
      navigate("/login");
    }
  };

  const dashboardPath = role === "MASTER" ? "/master-dashboard" : "/agency-dashboard";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              SympoHub
            </span>
          </Link>

          {/* Navigation Menu */}
          <div className="flex items-center space-x-1">
            {role === "AGENCY" && (
              <>
                <Link to="/agency-dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    대시보드
                  </Button>
                </Link>
                <Link to="/projects">
                  <Button variant="ghost" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    행사 관리
                  </Button>
                </Link>
                <Link to="/participants">
                  <Button variant="ghost" className="gap-2">
                    <Users className="w-4 h-4" />
                    참가자 관리
                  </Button>
                </Link>
              </>
            )}

            {role === "MASTER" && (
              <>
                <Link to="/master-dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    대시보드
                  </Button>
                </Link>
                <Link to="/master/data">
                  <Button variant="ghost" className="gap-2">
                    <Database className="w-4 h-4" />
                    데이터 관리
                  </Button>
                </Link>
                <Link to="/master/permissions">
                  <Button variant="ghost" className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    권한 관리
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <div className="font-medium text-foreground">{profile?.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {role === "MASTER" ? "시스템 관리자" : "에이전시"}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
