import React, { useState, useEffect } from "react";
import { authHelpers } from "../components/utils/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Moon, User as UserIcon, Lock, Tag, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    promoCode: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Проверяем, авторизован ли уже пользователь
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authHelpers.getCurrentUser();
        if (user) {
          // Если пользователь уже авторизован, перенаправляем на главную
          window.location.href = createPageUrl('Home');
        }
      } catch (error) {
        console.log('Пользователь не авторизован');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError("");
  };

  const validateLoginForm = () => {
    if (!formData.username.trim()) {
      setError("Введите логин");
      return false;
    }
    if (!formData.password) {
      setError("Введите пароль");
      return false;
    }
    return true;
  };

  const validateRegisterForm = () => {
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsLoading(true);
    setError("");

    try {
      console.log('Попытка входа с данными:', { 
        username: formData.username, 
        password: '***' 
      });
      
      const user = await authHelpers.login(formData.username, formData.password);
      console.log('Вход выполнен успешно:', user);
      
      // Перенаправляем на главную страницу
      window.location.href = createPageUrl('Home');
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.message || 'Ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setIsLoading(true);
    setError("");

    try {
      console.log('Попытка регистрации с данными:', { 
        username: formData.username, 
        password: '***',
        promoCode: formData.promoCode 
      });
      
      const user = await authHelpers.register(
        formData.username, 
        formData.password, 
        formData.promoCode
      );
      
      console.log('Регистрация выполнена успешно:', user);
      
      // Переключаемся на форму входа
      setIsLogin(true);
      setFormData({
        username: formData.username, // Оставляем логин
        password: "",
        confirmPassword: "",
        promoCode: ""
      });

      // Показываем сообщение об успехе
      alert("Регистрация завершена! Теперь войдите в систему.");

    } catch (err) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 cosmic-bg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 cosmic-bg">
      <style>{`
        .cosmic-bg {
          background-color: #0F172A;
          background-image: radial-gradient(circle at 10% 10%, rgba(234, 179, 8, 0.1) 0%, transparent 30%),
                            radial-gradient(circle at 80% 90%, rgba(59, 130, 246, 0.1) 0%, transparent 30%);
        }
        .card-glow {
          background-color: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(51, 65, 85, 0.5);
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
        }
      `}</style>
      
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
            <CardTitle className="text-yellow-400 text-2xl">
              {isLogin ? 'Вход в систему' : 'Регистрация'}
            </CardTitle>
            <p className="text-slate-400 mt-2">
              {isLogin ? 'Войдите в ваш аккаунт GoldenMoon' : 'Создайте ваш аккаунт в GoldenMoon'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Логин</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder={isLogin ? "Ваш логин" : "Придумайте ваш логин"}
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
                    placeholder={isLogin ? "Ваш пароль" : "Минимум 6 символов"}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
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
                </>
              )}

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
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
                    {isLogin ? 'Вход...' : 'Регистрация...'}
                  </>
                ) : (
                  isLogin ? 'Войти в систему' : 'Зарегистрироваться'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
                <Button 
                  variant="link" 
                  className="text-yellow-400 p-0 h-auto" 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFormData({
                      username: "",
                      password: "",
                      confirmPassword: "",
                      promoCode: ""
                    });
                  }}
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}