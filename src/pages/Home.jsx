import React, { useState, useEffect, useMemo } from "react";
import Auth from "../components/utils/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  TrendingUp,
  Wallet,
  Trophy,
  Users,
  Star,
  Zap,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { createPageUrl } from "@/utils";

import EventCard from "../components/events/EventCard";
import BetSlip from "../components/betting/BetSlip";

const getLeagueDisplayName = (league) => {
    const leagueMap = {
        'icehockey_nhl': 'NHL',
        'soccer_uefa_european_championship': 'Евро 2024',
        'soccer_epl': 'АПЛ',
        'soccer_spain_la_liga': 'Ла Лига',
        'soccer_germany_bundesliga': 'Бундеслига',
        'soccer_italy_serie_a': 'Серия А',
        'soccer_france_ligue_one': 'Лига 1',
        'mma_mixed_martial_arts': 'UFC/MMA',
    };
    return leagueMap[league] || league;
};

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedBets, setSelectedBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");

  useEffect(() => {
    const initializePage = async () => {
      try {
        const userData = await Auth.me();
        setUser(userData);
        await loadEvents();
      } catch (error) {
        console.error('Auth error:', error);
        window.location.href = createPageUrl('Auth');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  const loadEvents = async () => {
    setEventsLoading(true);
    setError("");
    try {
      const data = await Auth.getEvents();
      setAllEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Ошибка загрузки событий. Попробуйте обновить.');
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setSelectedLeague("all"); // Сбрасываем фильтр лиг при смене вида спорта
  };

  const footballLeagues = useMemo(() => {
    if (selectedSport !== 'football') return [];
    const leagues = allEvents
      .filter(e => e.league.startsWith('soccer_'))
      .map(e => e.league);
    return ['all', ...Array.from(new Set(leagues))];
  }, [allEvents, selectedSport]);

  const filteredEvents = useMemo(() => {
    let events = allEvents;

    if (selectedSport !== 'all') {
      if (selectedSport === 'football') {
        events = events.filter(e => e.league.startsWith('soccer_'));
        if (selectedLeague !== 'all') {
          events = events.filter(e => e.league === selectedLeague);
        }
      } else {
        const sportKeyMap = {
          'icehockey': 'icehockey_nhl',
          'mma': 'mma_mixed_martial_arts'
        };
        events = events.filter(e => e.league === sportKeyMap[selectedSport]);
      }
    }
    return events;
  }, [allEvents, selectedSport, selectedLeague]);


  const handleAddToBetSlip = (event, market, outcome, odds) => {
    const bet = {
      id: `${event.id}_${market}_${outcome}`,
      event: event,
      market: market,
      outcome: outcome,
      odds: odds
    };

    setSelectedBets(prev => {
      const existing = prev.find(b => b.id === bet.id);
      if (existing) {
        return prev.filter(b => b.id !== bet.id);
      }
      return [...prev, bet];
    });

    if (!showBetSlip && selectedBets.length === 0) {
      setShowBetSlip(true);
    }
  };

  const handleRemoveBet = (betId) => {
    setSelectedBets(prev => prev.filter(b => b.id !== betId));
  };

  const clearBetSlip = () => {
    setSelectedBets([]);
    setShowBetSlip(false);
  };

  const handleBalanceUpdate = (newBalance) => {
    setUser(prev => ({ ...prev, balance: newBalance }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center cosmic-bg">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen cosmic-bg">
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

      <div className="container mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Добро пожаловать, {user.full_name}!
              </h1>
              <p className="text-slate-400">
                Делайте ставки на спортивные события и выигрывайте
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Card className="card-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-slate-400">Баланс</p>
                      <p className="text-lg font-semibold text-white">
                        ₽{user.balance?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Badge
                variant={user.status === 'approved' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {user.status === 'approved' ? 'Верифицирован' : 'На модерации'}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {/* ... quick stats cards ... */}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-glow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-yellow-400" />
                      Спортивные события
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadEvents}
                      disabled={eventsLoading}
                      className="border-slate-700"
                    >
                      {eventsLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  )}

                  <Tabs defaultValue="all" className="w-full" onValueChange={handleSportChange} value={selectedSport}>
                    <TabsList className="grid w-full grid-cols-4 mb-4 bg-slate-800/50">
                      <TabsTrigger value="all">Все</TabsTrigger>
                      <TabsTrigger value="football">Футбол</TabsTrigger>
                      <TabsTrigger value="icehockey">Хоккей</TabsTrigger>
                      <TabsTrigger value="mma">MMA</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {selectedSport === 'football' && footballLeagues.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4"
                    >
                      <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedLeague} value={selectedLeague}>
                        <TabsList className="flex flex-wrap h-auto justify-start bg-slate-800/50">
                          {footballLeagues.map(league => (
                            <TabsTrigger key={league} value={league} className="text-xs">
                              {league === 'all' ? 'Все лиги' : getLeagueDisplayName(league)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </motion.div>
                  )}
                    
                  <div className="space-y-4">
                      {eventsLoading ? (
                        <div className="text-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-yellow-400 mx-auto mb-2" />
                          <p className="text-slate-400">Загрузка событий...</p>
                        </div>
                      ) : filteredEvents.length > 0 ? (
                        <AnimatePresence>
                          {filteredEvents.map((event, index) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <EventCard
                                event={event}
                                onAddToBetSlip={handleAddToBetSlip}
                                selectedBets={selectedBets}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400">Нет доступных событий для этого вида спорта</p>
                        </div>
                      )}
                    </div>

                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bet Slip */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-6"
            >
             <BetSlip
                isOpen={showBetSlip || selectedBets.length > 0}
                onClose={() => setShowBetSlip(false)}
                bets={selectedBets}
                onRemoveBet={handleRemoveBet}
                onClear={clearBetSlip}
                userBalance={user?.balance || 0}
                onBalanceUpdate={handleBalanceUpdate}
                isDialog={false} 
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}