
import React, { useState, useEffect } from 'react';
import Auth from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ThreadView from '../support/ThreadView';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from "sonner";

// Функции больше не импортируются напрямую

export default function SupportManagement() {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await Auth.getSupportThreads(true); // isAdmin = true
      setThreads(data);
      
    } catch (e) {
      toast.error(e.message || "Не удалось загрузить обращения");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="card-glow">
        <CardHeader><CardTitle>Загрузка обращений...</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[75vh]">
      {/* Threads List */}
      <Card className="card-glow flex flex-col col-span-1">
        <CardHeader>
          <CardTitle className="text-yellow-400">Все обращения</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {threads.length > 0 ? (
            <div className="space-y-3">
              {threads.map(thread => (
                <div 
                  key={thread.id} 
                  className={`p-4 rounded-lg cursor-pointer transition-all ${selectedThreadId === thread.id ? 'bg-yellow-500/20' : 'bg-slate-800/50 hover:bg-slate-700/50'}`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white">{thread.title}</p>
                    <Badge className={`${thread.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'} border-0`}>
                      {thread.status === 'open' ? 'Открыт' : 'Закрыт'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Пользователь ID: ...{thread.user_id.slice(-6)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Обновлено: {format(new Date(thread.updated_date), "dd MMM yyyy, HH:mm", { locale: ru })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center h-full flex flex-col justify-center items-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
              <p>Нет активных обращений.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thread View */}
      <div className="lg:col-span-2">
        {selectedThreadId ? (
          <ThreadView threadId={selectedThreadId} key={selectedThreadId} isAdminView={true} onUpdate={loadData}/>
        ) : (
          <div className="h-full flex items-center justify-center card-glow rounded-lg">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4"/>
              <p className="text-slate-400">Выберите обращение для просмотра</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
