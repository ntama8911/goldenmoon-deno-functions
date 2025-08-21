
import React, { useState, useEffect, useRef } from "react";
import Auth from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";

export default function ThreadView({ threadId, isAdminView = false, onUpdate }) {
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadThread();
  }, [threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const loadThread = async () => {
    setIsLoading(true);
    try {
      const userData = await Auth.me();
      setUser(userData);
      
      const data = await Auth.getSupportMessages({ threadId });

      setThread(data.thread);
      setMessages(data.messages);

    } catch (e) {
      toast.error(e.message || "Не удалось загрузить обращение");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await Auth.sendSupportMessage({ threadId, message: newMessage });
      setNewMessage("");
      await loadThread();
      if(onUpdate) onUpdate();
    } catch (e) {
      toast.error(e.message || "Не удалось отправить сообщение");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
        await Auth.updateSupportThreadStatus({ threadId, status: newStatus });
        toast.success(`Статус обращения изменен!`);
        await loadThread();
        if(onUpdate) onUpdate();
    } catch(e) {
        toast.error(e.message || "Не удалось изменить статус");
    }
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center card-glow rounded-lg"><Loader2 className="w-8 h-8 animate-spin text-yellow-400" /></div>;
  }

  if (!thread) {
    return <div className="h-full flex items-center justify-center card-glow rounded-lg"><p>Не удалось найти обращение</p></div>;
  }

  return (
    <Card className="card-glow flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-white">{thread.title}</CardTitle>
            {isAdminView && (
                <div className="space-x-2">
                    {thread.status === 'open' ? (
                        <Button variant="outline" onClick={() => handleStatusChange('closed')}>Закрыть обращение</Button>
                    ) : (
                        <Button variant="outline" onClick={() => handleStatusChange('open')}>Открыть заново</Button>
                    )}
                </div>
            )}
        </div>
        {isAdminView && <p className="text-sm text-slate-400">Пользователь: {messages[0]?.profiles?.full_name || "..."}</p>}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender_role === 'admin' ? 'items-start' : 'items-end'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${msg.sender_role === 'admin' ? 'bg-slate-700 text-white' : 'bg-yellow-600 text-slate-900'}`}>
              <p>{msg.message}</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {msg.sender_role === 'admin' ? 'Поддержка' : msg.profiles?.full_name || 'Вы'} - {format(new Date(msg.created_date), "dd MMM, HH:mm", { locale: ru })}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      {thread.status === 'open' && (
        <CardFooter className="pt-4 border-t border-slate-700">
          <div className="flex w-full gap-2">
            <Textarea
              placeholder="Введите ваше сообщение..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4"/>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
