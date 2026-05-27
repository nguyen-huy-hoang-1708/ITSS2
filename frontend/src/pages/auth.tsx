import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { Button, Card, CardBody, Input } from '@/components/ui';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { isAuthenticated, signIn, signUp } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const validate = () => {
    const next: Record<string, string> = {};
    if (mode === 'register' && !form.full_name.trim()) next.full_name = 'Họ tên là bắt buộc';
    if (!form.email.trim()) next.email = 'Email là bắt buộc';
    if (!form.password.trim()) next.password = 'Mật khẩu là bắt buộc';
    if (form.password && form.password.length < 6) next.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password });
        pushToast({ title: 'Đăng nhập thành công', description: 'Dữ liệu đã được đồng bộ.', variant: 'success' });
        navigate('/app');
      } else {
        await signUp({ full_name: form.full_name, email: form.email, password: form.password });
        pushToast({ title: 'Đăng ký thành công', description: 'Bạn có thể đăng nhập ngay.', variant: 'success' });
        navigate('/login');
      }
    } catch (error) {
      pushToast({ title: 'Thao tác thất bại', description: error instanceof Error ? error.message : 'Vui lòng thử lại', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(47,134,255,0.16),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-hero-grid bg-[length:24px_24px] opacity-25" />
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <CalendarDays className="h-4 w-4 text-brand-300" />
              Calendar Pro
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Quản lý lịch học và deadline với giao diện hiện đại.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">Thiết kế tối ưu cho demo sản phẩm: sạch sẽ, mượt mà, có dashboard, lịch tháng, danh sách sự kiện và xác thực an toàn.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: CheckCircle2, title: 'Responsive', desc: 'Desktop, tablet, mobile' },
                { icon: ShieldCheck, title: 'Secure', desc: 'JWT + refresh token' },
                { icon: CalendarDays, title: 'Fast', desc: 'Load & manage smoothly' },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <item.icon className="h-5 w-5 text-brand-300" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="border-white/70 bg-white/85 shadow-2xl backdrop-blur-xl">
          <CardBody className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
              <p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Truy cập dashboard và quản lý lịch trình.' : 'Bắt đầu thiết lập workspace cá nhân.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' ? (
                <Field label="Họ tên" error={errors.full_name}>
                  <Input value={form.full_name} onChange={(e) => setForm((current) => ({ ...current, full_name: e.target.value }))} placeholder="Nguyễn Văn A" />
                </Field>
              ) : null}
              <Field label="Email" error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} placeholder="you@example.com" />
              </Field>
              <Field label="Mật khẩu" error={errors.password}>
                <Input type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} placeholder="••••••••" />
              </Field>

              <Button type="submit" className="w-full py-3" isLoading={loading}>
                {mode === 'login' ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="text-center text-sm text-slate-500">
              {mode === 'login' ? (
                <p>
                  Chưa có tài khoản? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Đăng ký</Link>
                </p>
              ) : (
                <p>
                  Đã có tài khoản? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Đăng nhập</Link>
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}
    </label>
  );
}