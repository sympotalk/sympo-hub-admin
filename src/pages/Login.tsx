import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      const redirectPath = role === "MASTER" ? "/master-dashboard" : "/agency-dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("아이디와 비밀번호를 입력해주세요");
      return;
    }

    setLoading(true);

    const { error } = await signIn(username, password);

    if (error) {
      toast.error("로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.");
      setLoading(false);
    } else {
      toast.success("로그인되었습니다");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-white to-white p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">SH</span>
          </div>
          <CardTitle className="text-3xl font-bold">SympoHub</CardTitle>
          <CardDescription className="text-base">
            제약·의학 학술행사 운영 플랫폼
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all" 
              disabled={loading}
            >
              <LogIn className="w-4 h-4" />
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">계정이 없으신가요? </span>
            <Link to="/signup" className="text-primary font-medium hover:underline">
              회원가입
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
