
import React, { useState, useEffect } from "react";
import Auth from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Tag, Users, Calendar, DollarSign, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

// Функции больше не импортируются напрямую

export default function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    user_role: "user",
    bonus_balance: 0,
    max_uses: "",
    expires_at: "",
    is_active: true
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    setIsLoading(true);
    try {
      const data = await Auth.getPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      toast.error(error.message || "Ошибка загрузки промокодов");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      user_role: "user",
      bonus_balance: 0,
      max_uses: "",
      expires_at: "",
      is_active: true
    });
    setEditingCode(null);
  };

  const openModal = (code = null) => {
    if (code) {
      setFormData({
        code: code.code,
        description: code.description,
        user_role: code.user_role,
        bonus_balance: code.bonus_balance || 0,
        max_uses: code.max_uses || "",
        expires_at: code.expires_at ? format(new Date(code.expires_at), 'yyyy-MM-dd') : "",
        is_active: code.is_active
      });
      setEditingCode(code);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        bonus_balance: parseFloat(formData.bonus_balance) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      if (editingCode) {
        await Auth.updatePromoCode({ id: editingCode.id, ...payload });
        toast.success("Промокод успешно обновлен!");
      } else {
        await Auth.createPromoCode(payload);
        toast.success("Промокод успешно создан!");
      }

      setIsModalOpen(false);
      resetForm();
      loadPromoCodes();
    } catch (error) {
      toast.error(error.message || "Ошибка при сохранении промокода");
    }
  };

  const handleDelete = async (code) => {
    if (confirm(`Удалить промокод "${code.code}"?`)) {
      try {
        await Auth.deletePromoCode({ id: code.id });
        toast.success("Промокод удален.");
        loadPromoCodes();
      } catch (error) {
        toast.error(error.message || "Ошибка при удалении промокода");
      }
    }
  };

  const toggleActive = async (code) => {
    try {
      await Auth.updatePromoCode({ id: code.id, is_active: !code.is_active });
      loadPromoCodes();
    } catch (error) {
      toast.error(error.message || "Ошибка при изменении статуса промокода");
    }
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? (
      <Badge className="bg-red-500/20 text-red-400 border-0">Админ</Badge>
    ) : (
      <Badge className="bg-blue-500/20 text-blue-400 border-0">Пользователь</Badge>
    );
  };

  const getStatusBadge = (code) => {
    if (!code.is_active) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-0">Неактивен</Badge>;
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-0">Истек</Badge>;
    }
    if (code.max_uses && code.used_count >= code.max_uses) {
      return <Badge className="bg-purple-500/20 text-purple-400 border-0">Исчерпан</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-0">Активен</Badge>;
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-yellow-400">Управление промокодами</CardTitle>
          <Button onClick={() => openModal()} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">
            <Plus className="w-4 h-4 mr-2" />
            Создать промокод
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {promoCodes.map((code, index) => (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-yellow-400" />
                              <span className="font-bold text-white text-lg">{code.code}</span>
                            </div>
                            {getRoleBadge(code.user_role)}
                            {getStatusBadge(code)}
                          </div>
                          <p className="text-slate-300 text-sm mb-2">{code.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            {code.bonus_balance > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>Бонус: ₽{code.bonus_balance}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>
                                Использований: {code.used_count}
                                {code.max_uses ? `/${code.max_uses}` : ''}
                              </span>
                            </div>
                            {code.expires_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  До: {format(new Date(code.expires_at), 'dd.MM.yyyy', { locale: ru })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.is_active}
                            onCheckedChange={() => toggleActive(code)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(code)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {promoCodes.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">Промокоды не найдены</h3>
                <p className="text-slate-500">Создайте первый промокод для регистрации пользователей</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="card-glow max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Редактировать промокод' : 'Создать промокод'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код промокода</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Например: WELCOME2024"
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание промокода"
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_role">Роль пользователя</Label>
                <Select
                  value={formData.user_role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_role: value }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus_balance">Бонусный баланс</Label>
                <Input
                  id="bonus_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bonus_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, bonus_balance: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Макс. использований</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="Без ограничений"
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Дата истечения</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Активен</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">
                {editingCode ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
