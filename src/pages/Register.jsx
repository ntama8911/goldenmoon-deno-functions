import React, { useState } from "react";
import Auth from "../components/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Moon, User as UserIcon, Lock, Tag, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    promoCode: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Введите логин");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return false;
    }
    if (!formData.promoCode.trim()) {
      setError("Введите промокод");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      await Auth.register(formData.username, formData.password, formData.promoCode);
      
      toast.success("Регистрация завершена!", {
        description: "Теперь войдите в систему, используя ваш логин и пароль.",
        duration: 5000,
      });

      // Перенаправляем на страницу входа
      setTimeout(() => {
        window.location.href = createPageUrl('Login');
      }, 1000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cosmic-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="card-glow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Moon className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-yellow-400 text-2xl">Регистрация</CardTitle>
            <p className="text-slate-400 mt-2">Создайте ваш аккаунт в GoldenMoon</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Логин</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Придумайте ваш логин"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Подтверждение пароля</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promoCode" className="text-slate-300">Промокод *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="promoCode"
                    name="promoCode"
                    type="text"
                    placeholder="Введите промокод"
                    value={formData.promoCode}
                    onChange={handleChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">Промокод обязателен для регистрации</p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Уже есть аккаунт?{' '}
                <Button 
                  variant="link" 
                  className="text-yellow-400 p-0 h-auto" 
                  onClick={() => window.location.href = createPageUrl('Login')}
                >
                  Войти
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}