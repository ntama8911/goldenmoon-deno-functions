import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Trash2, TrendingUp, Calculator, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Auth from "../utils/auth";

export default function BetSlip({ isOpen, onClose, bets, onRemoveBet, onClear, userBalance, onBalanceUpdate, isDialog = true }) {
  const [stakes, setStakes] = useState({});
  const [expressStake, setExpressStake] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  
  useEffect(() => {
    if (bets.length < 2) {
      setActiveTab("single");
    }
  }, [bets]);

  const updateStake = (betId, stake) => {
    setStakes(prev => ({ ...prev, [betId]: stake }));
  };
  
  const handleExpressStakeChange = (value) => {
      setExpressStake(value);
  }

  const getTotalStake = () => {
    return Object.values(stakes).reduce((sum, stake) => sum + (parseFloat(stake) || 0), 0);
  };

  const getExpressPayout = () => {
    if(!expressStake || bets.length < 1) return 0;
    const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
    return (parseFloat(expressStake) || 0) * totalOdds;
  };

  const getSinglePayout = (betId, odds) => {
    const stake = parseFloat(stakes[betId]) || 0;
    return stake * odds;
  };

  const placeSingleBets = async () => {
    setIsPlacing(true);
    const totalStake = getTotalStake();
    
    try {
      const betsData = bets.map(bet => ({
        eventId: bet.event.id,
        market: bet.market,
        outcome: bet.outcome,
        odds: bet.odds,
        stake: parseFloat(stakes[bet.id]) || 0,
        potentialPayout: getSinglePayout(bet.id, bet.odds)
      })).filter(bet => bet.stake > 0);

      const data = await Auth.placeBet({
        bets: betsData,
        betType: 'single',
        totalStake: totalStake
      });

      toast.success("Ставки успешно размещены!");
      onBalanceUpdate?.(data.newBalance);
      onClear();
      onClose();
    } catch (error) {
      console.error("Error placing bets:", error);
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setIsPlacing(false);
    }
  };

  const placeExpressBet = async () => {
    const stake = parseFloat(expressStake);
    if (stake <= 0 || bets.length < 2) return;
    
    setIsPlacing(true);
    
    try {
      const expressId = `express_${Date.now()}`;
      const betsData = bets.map(bet => ({
        eventId: bet.event.id,
        market: bet.market,
        outcome: bet.outcome,
        odds: bet.odds
      }));

      const data = await Auth.placeBet({
        bets: betsData,
        betType: 'express',
        totalStake: stake,
        potentialPayout: getExpressPayout(),
        expressId: expressId
      });

      toast.success("Экспресс-ставка успешно размещена!");
      onBalanceUpdate?.(data.newBalance);
      onClear();
      onClose();
    } catch (error) {
      console.error("Error placing express bet:", error);
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setIsPlacing(false);
    }
  };
  
  const totalSingleStake = getTotalStake();
  const expressStakeNum = parseFloat(expressStake) || 0;
  
  const canPlaceSingle = totalSingleStake > 0 && totalSingleStake <= userBalance;
  const canPlaceExpress = expressStakeNum > 0 && expressStakeNum <= userBalance && bets.length >= 2;

  const BetSlipContent = () => (
     <Card className="card-glow border-0 shadow-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-yellow-400">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Купон ставок
            </div>
            {bets.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  className="text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
            )}
          </CardTitle>
        </CardHeader>

        {bets.length === 0 ? (
          <CardContent>
            <div className="text-center py-8">
              <Calculator className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Купон пуст</p>
              <p className="text-slate-500 text-sm">Добавьте события для ставки</p>
            </div>
          </CardContent>
        ) : (
          <CardContent className="space-y-6">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              <AnimatePresence>
                {bets.map((bet) => (
                  <motion.div
                    key={bet.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-2">
                          <p className="text-white font-medium text-sm leading-tight">
                            {bet.event.home_team} vs {bet.event.away_team}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                              {bet.market}: {bet.outcome}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {bet.odds.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveBet(bet.id)}
                          className="text-slate-400 hover:text-red-400 shrink-0 w-6 h-6"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="single" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
                  Одиночные
                </TabsTrigger>
                <TabsTrigger 
                  value="express" 
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900"
                  disabled={bets.length < 2}
                >
                  Экспресс
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4 mt-6">
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <div key={bet.id} className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 truncate">{bet.outcome}</p>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="Ставка"
                          value={stakes[bet.id] || ""}
                          onChange={(e) => updateStake(bet.id, e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white text-center h-8"
                        />
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-green-400 font-medium text-sm">
                          ₽{getSinglePayout(bet.id, bet.odds).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-slate-300">Общая ставка:</span>
                  <span className="text-yellow-400">₽{totalSingleStake.toFixed(2)}</span>
                </div>

                {totalSingleStake > userBalance && (
                  <div className="flex items-center gap-2 p-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Недостаточно средств</span>
                  </div>
                )}

                <Button
                  onClick={placeSingleBets}
                  disabled={!canPlaceSingle || isPlacing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-semibold"
                >
                  {isPlacing ? "Размещение..." : "Разместить ставки"}
                </Button>
              </TabsContent>

              <TabsContent value="express" className="space-y-4 mt-6">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Общий кф: {bets.reduce((acc, bet) => acc * bet.odds, 1).toFixed(2)}</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-4">
                        <label className="text-slate-300 flex-1">Сумма ставки:</label>
                        <Input
                          type="number"
                          min="0"
                          step="10"
                          placeholder="0"
                          value={expressStake}
                          onChange={(e) => handleExpressStakeChange(e.target.value)}
                          className="w-32 bg-slate-700 border-slate-600 text-white text-center h-8"
                        />
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold pt-2">
                        <span className="text-slate-300">Выигрыш:</span>
                        <span className="text-green-400">₽{getExpressPayout().toFixed(2)}</span>
                      </div>
                  </div>
                </div>

                {expressStakeNum > userBalance && (
                  <div className="flex items-center gap-2 p-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Недостаточно средств</span>
                  </div>
                )}
                
                <Button
                  onClick={placeExpressBet}
                  disabled={!canPlaceExpress || isPlacing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-semibold"
                >
                  {isPlacing ? "Размещение..." : "Разместить экспресс"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
  );

  if (isDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto card-glow border-slate-700 p-0">
          <BetSlipContent />
        </DialogContent>
      </Dialog>
    )
  }

  return <BetSlipContent />;
}