
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, TrendingUp, Calendar, Target, BarChart } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const getSportDisplayInfo = (sport) => {
    const key = sport?.toLowerCase() || '';

    // Проверяем английские названия от API
    if (key.includes('soccer') || key.includes('football') || key.includes('футбол')) {
        return { badge: 'Футбол', color: 'bg-green-500/20 text-green-400' };
    }
    if (key.includes('hockey') || key.includes('хоккей') || key.includes('ice hockey')) {
        return { badge: 'Хоккей', color: 'bg-cyan-500/20 text-cyan-400' };
    }
    if (key.includes('basketball') || key.includes('баскетбол')) {
        return { badge: 'Баскетбол', color: 'bg-orange-500/20 text-orange-400' };
    }
    if (key.includes('mma') || key.includes('mixed martial arts') || key.includes('уфс') || key.includes('ufc')) {
        return { badge: 'ММА', color: 'bg-pink-500/20 text-pink-400' };
    }

    return { badge: sport, color: 'bg-slate-500/20 text-slate-400' };
};

const getLeagueDisplayName = (league) => {
    const leagueMap = {
        'icehockey_nhl': 'NHL',
        'soccer_uefa_european_championship': 'Евро 2024',
        'soccer_epl': 'Английская Премьер-лига',
        'soccer_spain_la_liga': 'Ла Лига',
        'soccer_germany_bundesliga': 'Бундеслига',
        'soccer_italy_serie_a': 'Серия А',
        'soccer_france_ligue_one': 'Лига 1',
        'mma_mixed_martial_arts': 'UFC/MMA',
        'americanfootball_nfl': 'NFL',
        'basketball_nba': 'NBA'
    };
    
    return leagueMap[league] || league;
};

export default function EventCard({ event, onAddToBetSlip, selectedBets = [] }) {
  const hasSpreads = event.spreads_home_odds && event.spreads_away_odds;
  const hasTotals = event.totals_over_odds && event.totals_under_odds;
  const hasH2H = event.home_odds && event.away_odds;

  const availableTabs = [];
  if (hasH2H) availableTabs.push({ key: "h2h", label: "1X2", icon: TrendingUp });
  if (hasSpreads) availableTabs.push({ key: "spreads", label: "Фора", icon: Target });
  if (hasTotals) availableTabs.push({ key: "totals", label: "Тотал", icon: BarChart });

  const [activeTab, setActiveTab] = useState(availableTabs.length > 0 ? availableTabs[0].key : "");

  const isEventStartingSoon = () => {
    const eventTime = new Date(event.commence_time);
    const now = new Date();
    const timeDiff = eventTime - now;
    return timeDiff < 15 * 60 * 1000; // 15 minutes
  };

  const canPlaceBet = !isEventStartingSoon() && event.status === 'scheduled';

  const formatTime = (dateString) => {
    return format(new Date(dateString), "dd MMM, HH:mm", { locale: ru });
  };

  const getTimeUntilEvent = () => {
    const eventTime = new Date(event.commence_time);
    const now = new Date();
    const diffHours = Math.floor((eventTime - now) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((eventTime - now) / (1000 * 60));
      return `${diffMinutes} мин`;
    } else if (diffHours < 24) {
      return `${diffHours} ч`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} дн`;
    }
  };

  const isBetSelected = (market, outcome) => {
    const betId = `${event.id}_${market}_${outcome}`;
    return selectedBets.some(bet => bet.id === betId);
  };

  const sportDisplay = getSportDisplayInfo(event.sport);
  const leagueDisplay = getLeagueDisplayName(event.league);

  if (availableTabs.length === 0) {
    return (
      <Card className="card-glow hover:shadow-xl transition-all duration-300 group h-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${sportDisplay.color} border-0 text-xs sm:text-sm font-medium`}>
              {sportDisplay.badge}
            </Badge>
            <div className="flex items-center text-slate-400 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {getTimeUntilEvent()}
            </div>
          </div>
          
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
              <div className="text-center flex-1">
                <p className="text-white font-semibold text-sm sm:text-base leading-tight">
                  {event.home_team}
                </p>
              </div>
              <div className="text-slate-400 font-medium text-xs sm:text-sm px-2">VS</div>
              <div className="text-center flex-1">
                <p className="text-white font-semibold text-sm sm:text-base leading-tight">
                  {event.away_team}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-3 sm:py-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-xs sm:text-sm">Коэффициенты загружаются...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow hover:shadow-xl transition-all duration-300 group h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${sportDisplay.color} border-0 text-xs sm:text-sm font-medium`}>
            {sportDisplay.badge}
          </Badge>
          <div className="flex items-center text-slate-400 text-xs sm:text-sm">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {getTimeUntilEvent()}
          </div>
        </div>
        
        <div className="flex items-center text-slate-500 text-xs sm:text-sm mb-3">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {formatTime(event.commence_time)}
        </div>

        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-2">
            <div className="text-center flex-1">
              <p className="text-white font-semibold text-sm sm:text-base leading-tight">
                {event.home_team}
              </p>
            </div>
            <div className="text-slate-400 font-medium text-xs sm:text-sm px-2">VS</div>
            <div className="text-center flex-1">
              <p className="text-white font-semibold text-sm sm:text-base leading-tight">
                {event.away_team}
              </p>
            </div>
          </div>
        </div>

        {event.league && (
          <div className="flex items-center justify-center text-slate-400 text-xs mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate font-medium">{leagueDisplay}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {!canPlaceBet ? (
          <div className="text-center py-3 sm:py-4">
            <p className="text-slate-500 text-xs sm:text-sm">
              {isEventStartingSoon() ? "Прием ставок закрыт" : "Событие завершено"}
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {availableTabs.length > 1 && (
              <TabsList className="grid w-full bg-slate-800/50 mb-4" 
                        style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
                {availableTabs.map(tab => (
                  <TabsTrigger 
                    key={tab.key}
                    value={tab.key} 
                    className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 text-xs"
                  >
                    <tab.icon className="w-3 h-3 mr-1" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            {hasH2H && (
              <TabsContent value="h2h" className="mt-0">
                <div className={`grid gap-2 ${event.draw_odds ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <Button
                    variant={isBetSelected("1X2", "1") ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("1X2", "1") 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => onAddToBetSlip(event, "1X2", "1", event.home_odds)}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("1X2", "1") ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>1</p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("1X2", "1") ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.home_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                  
                  {event.draw_odds && (
                    <Button
                      variant={isBetSelected("1X2", "X") ? "default" : "outline"}
                      className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                        isBetSelected("1X2", "X") 
                          ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                          : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                      }`}
                      onClick={() => onAddToBetSlip(event, "1X2", "X", event.draw_odds)}
                    >
                      <div className="text-center w-full">
                        <p className={`text-xs mb-1 ${
                          isBetSelected("1X2", "X") ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                        }`}>X</p>
                        <p className={`text-sm sm:text-base font-bold ${
                          isBetSelected("1X2", "X") ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                        }`}>
                          {event.draw_odds?.toFixed(2)}
                        </p>
                      </div>
                    </Button>
                  )}
                  
                  <Button
                    variant={isBetSelected("1X2", "2") ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("1X2", "2") 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => onAddToBetSlip(event, "1X2", "2", event.away_odds)}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("1X2", "2") ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>2</p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("1X2", "2") ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.away_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                </div>
              </TabsContent>
            )}

            {hasSpreads && (
              <TabsContent value="spreads" className="mt-0">
                <div className="grid gap-2 grid-cols-2">
                  <Button
                    variant={isBetSelected("Фора", `Ф1(${event.spreads_home_point > 0 ? '+' : ''}${event.spreads_home_point})`) ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("Фора", `Ф1(${event.spreads_home_point > 0 ? '+' : ''}${event.spreads_home_point})`) 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => {
                      const point = event.spreads_home_point;
                      const outcome = `Ф1(${point > 0 ? '+' : ''}${point})`;
                      onAddToBetSlip(event, "Фора", outcome, event.spreads_home_odds);
                    }}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("Фора", `Ф1(${event.spreads_home_point > 0 ? '+' : ''}${event.spreads_home_point})`) ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>
                        Ф1({event.spreads_home_point > 0 ? '+' : ''}{event.spreads_home_point})
                      </p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("Фора", `Ф1(${event.spreads_home_point > 0 ? '+' : ''}${event.spreads_home_point})`) ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.spreads_home_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                  
                  <Button
                    variant={isBetSelected("Фора", `Ф2(${event.spreads_away_point > 0 ? '+' : ''}${event.spreads_away_point})`) ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("Фора", `Ф2(${event.spreads_away_point > 0 ? '+' : ''}${event.spreads_away_point})`) 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => {
                      const point = event.spreads_away_point;
                      const outcome = `Ф2(${point > 0 ? '+' : ''}${point})`;
                      onAddToBetSlip(event, "Фора", outcome, event.spreads_away_odds);
                    }}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("Фора", `Ф2(${event.spreads_away_point > 0 ? '+' : ''}${event.spreads_away_point})`) ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>
                        Ф2({event.spreads_away_point > 0 ? '+' : ''}{event.spreads_away_point})
                      </p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("Фора", `Ф2(${event.spreads_away_point > 0 ? '+' : ''}${event.spreads_away_point})`) ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.spreads_away_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                </div>
              </TabsContent>
            )}

            {hasTotals && (
              <TabsContent value="totals" className="mt-0">
                <div className="grid gap-2 grid-cols-2">
                  <Button
                    variant={isBetSelected("Тотал", `Больше ${event.totals_point}`) ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("Тотал", `Больше ${event.totals_point}`) 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => {
                      const outcome = `Больше ${event.totals_point}`;
                      onAddToBetSlip(event, "Тотал", outcome, event.totals_over_odds);
                    }}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("Тотал", `Больше ${event.totals_point}`) ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>
                        Больше {event.totals_point}
                      </p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("Тотал", `Больше ${event.totals_point}`) ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.totals_over_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                  
                  <Button
                    variant={isBetSelected("Тотал", `Меньше ${event.totals_point}`) ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 group p-2 sm:p-3 h-auto ${
                      isBetSelected("Тотал", `Меньше ${event.totals_point}`) 
                        ? "bg-yellow-500 text-slate-900 hover:bg-yellow-400" 
                        : "bg-slate-800/50 border-slate-700 hover:bg-yellow-500/20 hover:border-yellow-500"
                    }`}
                    onClick={() => {
                      const outcome = `Меньше ${event.totals_point}`;
                      onAddToBetSlip(event, "Тотал", outcome, event.totals_under_odds);
                    }}
                  >
                    <div className="text-center w-full">
                      <p className={`text-xs mb-1 ${
                        isBetSelected("Тотал", `Меньше ${event.totals_point}`) ? "text-slate-900" : "text-slate-400 group-hover:text-yellow-400"
                      }`}>
                        Меньше {event.totals_point}
                      </p>
                      <p className={`text-sm sm:text-base font-bold ${
                        isBetSelected("Тотал", `Меньше ${event.totals_point}`) ? "text-slate-900" : "text-white group-hover:text-yellow-400"
                      }`}>
                        {event.totals_under_odds?.toFixed(2)}
                      </p>
                    </div>
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

        {event.status === 'live' && (
          <div className="flex items-center justify-center mt-3">
            <Badge className="bg-red-500/20 text-red-400 animate-pulse text-xs">
              ● LIVE
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
