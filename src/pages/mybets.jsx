import React, { useState, useEffect } from "react";
import Auth from "../components/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Trophy, Target, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function MyBetsPage() {
  const [bets, setBets] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await Auth.me();
      setUser(userData);
      
      const data = await Auth.getUserBets();
      setBets(data);

    } catch (error) {
      console.error("Error loading bets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBets = () => {
    if (statusFilter === "all") return bets;
    return bets.filter(bet => bet.status === statusFilter);
  };

  const filteredBets = getFilteredBets();

  const getBetsByStatus = (status) => {
    return bets.filter(bet => bet.status === status);
  };

  const stats = {
    pending: getBetsByStatus('pending').length,
    won: getBetsByStatus('won').length,
    lost: getBetsByStatus('lost').length,
    totalStaked: bets.reduce((sum, bet) => sum + (bet.stake || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
              <p className="text-slate-400">Загрузка ставок...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Мои ставки</h1>
              <p className="text-slate-400">История и статус ваших ставок</p>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Все ставки</SelectItem>
                <SelectItem value="pending">Ожидают</SelectItem>
                <SelectItem value="won">Выигранные</SelectItem>
                <SelectItem value="lost">Проигранные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Ожидают</CardTitle>
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Выигрыши</CardTitle>
                  <Trophy className="w-4 h-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">{stats.won}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Проигрыши</CardTitle>
                  <Target className="w-4 h-4 text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Поставлено</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">₽{stats.totalStaked.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-yellow-400">История ставок</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBets.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">Ставок нет</h3>
                  <p className="text-slate-500">Вы еще не сделали ни одной ставки</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBets.map((bet) => {
                    const event = bet.events;
                    if (!event) return null;

                    return (
                      <div
                        key={bet.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          bet.status === 'pending' 
                            ? 'bg-yellow-500/10 border-yellow-500' 
                            : bet.status === 'won'
                            ? 'bg-green-500/10 border-green-500'
                            : 'bg-red-500/10 border-red-500'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-white font-medium">
                              {event.home_team} vs {event.away_team}
                            </p>
                            <p className="text-slate-400 text-sm">{event.league}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                {bet.market}: {bet.outcome}
                              </Badge>
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                {bet.odds}
                              </Badge>
                              {bet.bet_type === 'express' && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                  Экспресс
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-slate-400 text-sm">Ставка</p>
                                <p className="text-white font-medium">₽{bet.stake}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-sm">Потенциальный выигрыш</p>
                                <p className="text-green-400 font-medium">₽{bet.potential_payout?.toFixed(2)}</p>
                              </div>
                              <Badge className={
                                bet.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                bet.status === 'won' ? 'bg-green-500/20 text-green-400' : 
                                'bg-red-500/20 text-red-400'
                              }>
                                {bet.status === 'pending' ? 'Ожидает' :
                                 bet.status === 'won' ? 'Выигрыш' : 'Проигрыш'}
                              </Badge>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">
                              {format(new Date(bet.created_date), "dd MMM, HH:mm", { locale: ru })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}