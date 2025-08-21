import React, { useState, useEffect } from "react";
import Auth from "../components/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Trophy, Target, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Results() {
  const [bets, setBets] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await Auth.me();
      setUser(userData);
      
      // Получаем только завершенные ставки
      const data = await Auth.getUserBets();
      const settledBets = data.filter(bet => ["won", "lost", "void"].includes(bet.status));
      setBets(settledBets);

    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBets = () => {
    const now = new Date();
    
    switch (timeFilter) {
      case "today":
        return bets.filter(bet => {
          const betDate = new Date(bet.created_date);
          return betDate.toDateString() === now.toDateString();
        });
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return bets.filter(bet => new Date(bet.created_date) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return bets.filter(bet => new Date(bet.created_date) >= monthAgo);
      default:
        return bets;
    }
  };

  const filteredBets = getFilteredBets();

  const stats = {
    totalBets: filteredBets.length,
    wonBets: filteredBets.filter(bet => bet.status === 'won').length,
    lostBets: filteredBets.filter(bet => bet.status === 'lost').length,
    voidBets: filteredBets.filter(bet => bet.status === 'void').length,
    totalStaked: filteredBets.reduce((sum, bet) => sum + (bet.stake || 0), 0),
    totalWon: filteredBets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (bet.potential_payout || 0), 0),
    totalLost: filteredBets.filter(bet => bet.status === 'lost').reduce((sum, bet) => sum + (bet.stake || 0), 0),
  };

  const winRate = stats.totalBets > 0 ? ((stats.wonBets / stats.totalBets) * 100).toFixed(1) : 0;
  const profit = stats.totalWon - stats.totalLost;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
              <p className="text-slate-400">Загрузка результатов...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Результаты</h1>
              <p className="text-slate-400">Статистика ваших ставок</p>
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Все время</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* P&L Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Общий P&L</CardTitle>
                  {profit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profit >= 0 ? '+' : ''}₽{profit.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Win Rate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Процент побед</CardTitle>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{winRate}%</p>
                <p className="text-slate-500 text-sm">{stats.wonBets} из {stats.totalBets}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staked Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Поставлено</CardTitle>
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">₽{stats.totalStaked.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Won Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-400">Выиграно</CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-400">₽{stats.totalWon.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-yellow-400">Последние результаты</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBets.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">Результатов нет</h3>
                  <p className="text-slate-500">За выбранный период нет завершенных ставок</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBets.slice(0, 10).map((bet) => {
                    const event = bet.events; // Event data is now nested
                    if (!event) return null;

                    return (
                      <div
                        key={bet.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          bet.status === 'won' 
                            ? 'bg-green-500/10 border-green-500' 
                            : bet.status === 'lost'
                            ? 'bg-red-500/10 border-red-500'
                            : 'bg-yellow-500/10 border-yellow-500'
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
                                <p className="text-slate-400 text-sm">Результат</p>
                                <p className={`font-bold ${
                                  bet.status === 'won' ? 'text-green-400' :
                                  bet.status === 'lost' ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {bet.status === 'won' ? `+₽${bet.potential_payout?.toFixed(2)}` :
                                   bet.status === 'lost' ? `-₽${bet.stake}` : '₽0.00'}
                                </p>
                              </div>
                              <Badge className={
                                bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                                bet.status === 'lost' ? 'bg-red-500/20 text-red-400' : 
                                'bg-yellow-500/20 text-yellow-400'
                              }>
                                {bet.status === 'won' ? 'Выигрыш' :
                                 bet.status === 'lost' ? 'Проигрыш' : 'Возврат'}
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