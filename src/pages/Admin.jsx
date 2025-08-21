
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, Database, Users, MessageSquare, Tag } from "lucide-react"; // Added Tag icon
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import DataManagement from "../components/admin/DataManagement";
import UserManagement from "../components/admin/UserManagement";
import SupportManagement from "../components/admin/SupportManagement";
import PromoCodeManagement from "../components/admin/PromoCodeManagement"; // New import

export default function AdminPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div className="card-glow p-8 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400">Доступ запрещен</h1>
          <p className="text-slate-400 mt-2">У вас нет прав для просмотра этой страницы.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-white mb-8">Админ панель</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 mb-8"> {/* Changed grid-cols-3 to grid-cols-4 */}
            <TabsTrigger value="users" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <Users className="w-4 h-4 mr-2"/> Пользователи
            </TabsTrigger>
            <TabsTrigger value="promocodes" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900"> {/* New TabTrigger */}
              <Tag className="w-4 h-4 mr-2"/> Промокоды
            </TabsTrigger>
             <TabsTrigger value="data" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <Database className="w-4 h-4 mr-2"/> Данные
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-slate-900">
              <MessageSquare className="w-4 h-4 mr-2"/> Поддержка
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="promocodes"> {/* New TabContent */}
            <PromoCodeManagement />
          </TabsContent>
          <TabsContent value="support">
            <SupportManagement />
          </TabsContent>
          <TabsContent value="data">
            <DataManagement />
          </TabsContent>
        </Tabs>

      </motion.div>
    </div>
  );
}
