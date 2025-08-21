
import React, { useState, useEffect } from "react";
import Auth from "../components/utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, MessageSquare } from "lucide-react";
import ThreadView from "../components/support/ThreadView";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils"; // <-- Добавлен этот импорт

// Функции больше не импортируются напрямую

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadMessage, setNewThreadMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      const userData = await Auth.me();
      setUser(userData);
      await loadThreads();
    } catch (e) {
      console.error(e);
      // Assuming createPageUrl is a globally available function or imported elsewhere
      window.location.href = createPageUrl("Auth"); 
    } finally {
      setIsLoading(false);
    }
  };

  const loadThreads = async () => {
    try {
      const data = await Auth.getSupportThreads();
      setThreads(data);
    } catch (error) {
      toast.error(error.message || "Ошибка загрузки обращений");
    }
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle || !newThreadMessage) {
      toast.error("Введите тему и сообщение");
      return;
    }
    try {
      const data = await Auth.createSupportThread({
        title: newThreadTitle,
        message: newThreadMessage
      });

      toast.success("Обращение создано!");
      setIsNewThreadModalOpen(false);
      setNewThreadTitle("");
      setNewThreadMessage("");
      await loadThreads();
      setSelectedThreadId(data.thread.id);
    } catch (e) {
      toast.error(e.message || "Ошибка создания обращения");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>;
  }

  return (
    <div className="h-screen flex flex-col p-4 lg:p-8 text-white">
      <h1 className="text-3xl font-bold text-white mb-8">Поддержка</h1>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Threads List */}
        <Card className="card-glow flex flex-col col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-yellow-400">Мои обращения</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => setIsNewThreadModalOpen(true)}>
              <PlusCircle className="w-6 h-6 text-yellow-400" />
            </Button>
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
                      Обновлено: {format(new Date(thread.updated_date), "dd MMM yyyy, HH:mm", { locale: ru })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center h-full flex flex-col justify-center items-center">
                <MessageSquare className="w-12 h-12 text-slate-600 mb-4" />
                <p>У вас нет обращений.</p>
                <p className="text-sm text-slate-500">Нажмите "+", чтобы создать новое.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thread View */}
        <div className="lg:col-span-2">
          {selectedThreadId ? (
            <ThreadView threadId={selectedThreadId} key={selectedThreadId} onUpdate={loadThreads} />
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

      <Dialog open={isNewThreadModalOpen} onOpenChange={setIsNewThreadModalOpen}>
        <DialogContent className="card-glow">
          <DialogHeader>
            <DialogTitle>Новое обращение</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm text-slate-400">Тема</label>
              <Input 
                value={newThreadTitle} 
                onChange={e => setNewThreadTitle(e.target.value)} 
                placeholder="Опишите кратко вашу проблему"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Сообщение</label>
              <Textarea
                value={newThreadMessage}
                onChange={e => setNewThreadMessage(e.target.value)}
                placeholder="Опишите подробно вашу проблему"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewThreadModalOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateThread}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
