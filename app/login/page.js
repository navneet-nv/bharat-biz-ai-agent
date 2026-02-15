'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Phone, Lock } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Login successful!');
        router.push('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-none shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <CardHeader className="space-y-2 text-center pb-8 pt-10">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/30"
            >
              <Sparkles size={24} />
            </motion.div>
            <div className="text-3xl font-bold tracking-tight text-slate-800">
              Bharat <span className="text-blue-600">Biz-Agent</span>
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Your AI-Powered Growth Partner
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    required
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="pl-10 h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                  />
                  <div className="absolute right-0 top-0 h-12 flex items-center pr-3">
                    <Link href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      Forgot?
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-transform active:scale-95 group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-slate-500">
                New to Bharat Biz?{' '}
                <Link href="/signup" className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">
                  Create Account
                </Link>
              </p>

              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                <span>Made for India</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>AI Powered</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

