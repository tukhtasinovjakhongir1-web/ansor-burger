'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = '/admin';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Xatolik');
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_25%_15%,#ffd2a8_0%,#fff4ea_50%)] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-card">
        <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white shadow-float ring-4 ring-gold-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ansor Burger" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display mt-4 text-center text-2xl font-extrabold">Admin panel</h1>
        <p className="mt-1 text-center text-[14px] text-ink-500">Ansor Burger boshqaruvi</p>

        <div className="relative mt-6">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            autoFocus
            autoComplete="current-password"
            className="pl-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-400"
            aria-label="Parolni ko'rsatish"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] font-semibold text-chili-500">{error}</p>}
        <Button type="submit" size="lg" block loading={loading} className="mt-5">
          Kirish
        </Button>
      </form>
    </div>
  );
}
