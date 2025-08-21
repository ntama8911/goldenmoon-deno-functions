
import React, { useState } from "react";
import Auth from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, ListChecks, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { updateOdds } from "@/api/functions"; // New import

export default function DataManagement() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [processResult, setProcessResult] = useState(null);

  const handleUpdateOdds = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    toast.info("Запущено обновление коэффициентов..."); // New toast notification
    try {
      // Replaced Auth.updateOdds() with the new updateOdds() function
      const { data, error } = await updateOdds();
      if (error) {
          throw new Error(error.error || "Неизвестная ошибка API");
      }
      setUpdateResult({ type: 'success', message: data.message });
      toast.success(data.message); // New toast notification
    } catch (err) {
      setUpdateResult({ type: 'error', message: err.message });
      toast.error(`Ошибка обновления: ${err.message}`); // New toast notification
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleProcessResults = async () => {
    setIsProcessing(true);
    setProcessResult(null);
    try {
      const data = await Auth.processResults();
      setProcessResult({ type: 'success', message: data.message });
    } catch (err) {
      setProcessResult({ type: 'error', message: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-yellow-400">Управление данными</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-300">
          <Info className="h-4 w-4" />
          <AlertTitle>Важная информация</AlertTitle>
          <AlertDescription>
            Не для всех событий доступны расширенные рынки (форы, тоталы). Их наличие зависит от поставщика данных.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-700 rounded-lg">
          <div>
            <h3 className="font-semibold text-white">Обновление коэффициентов</h3>
            <p className="text-sm text-slate-400">
              Загрузить актуальные события и коэффициенты из The Odds API (UFC, NHL, Футбол).
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Включает: основные исходы (1X2), форы (spreads), тоталы (totals). Запускать не чаще, чем раз в 15 минут.
            </p>
          </div>
          <Button onClick={handleUpdateOdds} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обновление...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Запустить
              </>
            )}
          </Button>
        </div>
        
        {updateResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert 
              variant={updateResult.type === 'error' ? 'destructive' : 'default'} 
              className={
                updateResult.type === 'success' ? 'border-green-500/50 bg-green-500/10' : ''
              }
            >
              {updateResult.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {updateResult.type === 'success' ? 'Успешно' : 'Ошибка'}
              </AlertTitle>
              <AlertDescription>
                {updateResult.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-slate-700 rounded-lg">
          <div>
            <h3 className="font-semibold text-white">Обработка результатов ставок</h3>
            <p className="text-sm text-slate-400">
              Проверить результаты завершенных событий и рассчитать ожидающие ставки.
            </p>
          </div>
          <Button onClick={handleProcessResults} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <ListChecks className="mr-2 h-4 w-4" />
                Запустить
              </>
            )}
          </Button>
        </div>

        {processResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert variant={processResult.type === 'error' ? 'destructive' : 'default'} className={processResult.type === 'success' ? 'border-green-500/50 bg-green-500/10' : ''}>
              {processResult.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{processResult.type === 'success' ? 'Успешно' : 'Ошибка'}</AlertTitle>
              <AlertDescription>{processResult.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
