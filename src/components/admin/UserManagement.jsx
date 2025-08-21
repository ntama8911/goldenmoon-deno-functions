
import React, { useState, useEffect } from "react";
import Auth from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, CircleDollarSign, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [balanceReason, setBalanceReason] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let filtered = allUsers;

    if (filter !== "all") {
      filtered = filtered.filter(u => u.status === filter);
    }
    if (searchTerm) {
      filtered = filtered.filter(u => 
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setUsers(filtered);
  }, [filter, searchTerm, allUsers]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await Auth.getAllUsers();
      setAllUsers(data);
      setUsers(data);
    } catch (error) {
      toast.error(error.message || "Ошибка загрузки пользователей");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      await Auth.updateUserStatus({ userId: user.id, status: newStatus });
      toast.success(`Статус пользователя ${user.full_name} изменен.`);
      loadUsers();
    } catch (e) {
      toast.error(e.message || "Ошибка при изменении статуса");
    }
  };

  const openBalanceModal = (user) => {
    setSelectedUser(user);
    setBalanceAmount(0);
    setBalanceReason("");
    setIsBalanceModalOpen(true);
  };

  const handleBalanceChange = async () => {
    if (!selectedUser || balanceAmount === 0 || !balanceReason) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      await Auth.updateUserBalance({
        userId: selectedUser.id,
        amount: balanceAmount,
        reason: balanceReason
      });
      
      toast.success(`Баланс пользователя ${selectedUser.full_name} успешно изменен.`);
      setIsBalanceModalOpen(false);
      loadUsers();
    } catch (e) {
      toast.error(e.message || "Ошибка при изменении баланса");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return <Badge className={`${styles[status]} border-0`}>{status}</Badge>;
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-yellow-400">Управление пользователями</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Поиск по имени или email..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="sm:w-48 bg-slate-800/50 border-slate-700">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="pending">Ожидают</SelectItem>
              <SelectItem value="approved">Одобрены</SelectItem>
              <SelectItem value="rejected">Отклонены</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="bg-slate-800/30 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white">{user.full_name}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(user.status)}
                      <div className="font-medium text-white">₽{user.balance?.toFixed(2) || '0.00'}</div>
                      <div className="flex gap-2">
                        {user.status === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300" onClick={() => handleStatusChange(user, 'approved')}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleStatusChange(user, 'rejected')}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300" onClick={() => openBalanceModal(user)}>
                          <CircleDollarSign className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                Пользователи не найдены
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
        <DialogContent className="card-glow">
          <DialogHeader>
            <DialogTitle>Изменить баланс {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-400">Сумма</label>
              <Input 
                type="number"
                value={balanceAmount}
                onChange={e => setBalanceAmount(parseFloat(e.target.value) || 0)}
                placeholder="Положительное для начисления, отрицательное для списания"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Причина</label>
              <Input 
                value={balanceReason}
                onChange={e => setBalanceReason(e.target.value)}
                placeholder="Например, 'Бонус за регистрацию'"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceModalOpen(false)}>Отмена</Button>
            <Button onClick={handleBalanceChange}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
