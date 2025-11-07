import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/lib/auth";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    organization: "",
    position: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      username: formData.username,
      password: formData.password,
      full_name: formData.full_name,
      organization: formData.organization,
      position: formData.position,
      phone: formData.phone,
    });

    if (error) {
      toast.error(error.message || "회원가입에 실패했습니다");
      setLoading(false);
    } else {
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-white to-white p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                로그인으로
              </Button>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
          <CardDescription>
            SympoHub 에이전시 계정을 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">소속 *</Label>
              <Input
                id="organization"
                name="organization"
                type="text"
                placeholder="소속 기관명"
                value={formData.organization}
                onChange={handleChange}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">이름 *</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="홍길동"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">직책</Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  placeholder="매니저"
                  value={formData.position}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">아이디 *</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="로그인에 사용할 아이디"
                value={formData.username}
                onChange={handleChange}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="6자 이상"
                value={formData.password}
                onChange={handleChange}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호 재입력"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all" 
              disabled={loading}
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "처리 중..." : "회원가입"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
