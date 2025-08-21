
import { supabase, authHelpers } from './supabaseClient';

export default class Auth {
  // --- Методы аутентификации ---
  static async me() {
    const user = await authHelpers.getCurrentUser();
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }
    return user;
  }

  static async login(username, password) {
    return await authHelpers.login(username, password);
  }

  static async register(username, password, promoCode) {
    return await authHelpers.register(username, password, promoCode);
  }

  static async logout() {
    await authHelpers.logout();
    return true;
  }
  
  static onAuthStateChange(callback) {
    // Эта функция-заглушка больше не нужна с кастомной логикой
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  // --- Методы для ставок и событий ---
  static async getEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'scheduled');

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error('Не удалось загрузить события');
    }
  }

  static async placeBet(payload) {
    try {
      const user = await this.me();
      const { bets, betType, totalStake, potentialPayout, expressId } = payload;

      // Проверяем баланс
      if (user.balance < totalStake) {
        throw new Error('Недостаточно средств');
      }

      // Создаем ставки
      const betsToInsert = bets.map(bet => ({
        user_id: user.id,
        event_id: bet.eventId,
        market: bet.market,
        outcome: bet.outcome,
        odds: bet.odds,
        stake: bet.stake || (totalStake / bets.length),
        potential_payout: bet.potentialPayout || potentialPayout,
        bet_type: betType,
        express_id: expressId,
        status: 'pending'
      }));

      const { data: betData, error: betError } = await supabase
        .from('bets')
        .insert(betsToInsert);

      if (betError) throw new Error(betError.message);

      // Списываем средства с баланса
      const newBalance = user.balance - totalStake;
      await supabase
        .from('profiles')
        .eq('id', user.id)
        .update({ balance: newBalance });

      return {
        bets: betData,
        newBalance: newBalance
      };
    } catch (error) {
      throw error;
    }
  }
  
  static async getUserBets() {
    try {
      const user = await this.me();
      
      const { data, error } = await supabase
        .from('bets')
        .select('*, events(*)')
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error('Не удалось загрузить ставки');
    }
  }

  // --- Админские методы: Пользователи ---
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error('Не удалось загрузить пользователей');
    }
  }

  static async updateUserStatus(payload) {
    try {
      const { userId, status } = payload;
      
      const { data, error } = await supabase
        .from('profiles')
        .eq('id', userId)
        .update({ status });

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateUserBalance(payload) {
    try {
      const { userId, amount, reason } = payload;
      
      // Получаем текущий баланс
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw new Error(userError.message);

      const newBalance = userData.balance + amount;

      // Обновляем баланс
      const { data, error } = await supabase
        .from('profiles')
        .eq('id', userId)
        .update({ balance: newBalance });

      if (error) throw new Error(error.message);

      // Записываем транзакцию
      await supabase
        .from('balance_transactions')
        .insert({
          user_id: userId,
          amount: amount,
          reason: reason,
          balance_after: newBalance
        });

      return data;
    } catch (error) {
      throw error;
    }
  }

  // --- Админские методы: Промокоды ---
  static async getPromoCodes() {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*');

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error('Не удалось загрузить промокоды');
    }
  }

  static async createPromoCode(payload) {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert(payload);

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updatePromoCode(payload) {
    try {
      const { id, ...updates } = payload;
      
      const { data, error } = await supabase
        .from('promo_codes')
        .eq('id', id)
        .update(updates);

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deletePromoCode(payload) {
    try {
      const { id } = payload;
      
      const { error } = await supabase
        .from('promo_codes')
        .eq('id', id)
        .delete();

      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // --- Методы поддержки ---
  static async getSupportThreads(isAdmin = false) {
    try {
      let query = supabase.from('support_threads').select('*');

      if (!isAdmin) {
        const user = await this.me();
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error('Не удалось загрузить обращения');
    }
  }

  static async createSupportThread(payload) {
    try {
      const user = await this.me();
      const { title, message } = payload;

      // Создаем тред
      const { data: threadData, error: threadError } = await supabase
        .from('support_threads')
        .insert({
          user_id: user.id,
          title: title,
          status: 'open'
        });

      if (threadError) throw new Error(threadError.message);
      const createdThread = threadData[0];

      // Создаем первое сообщение
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          thread_id: createdThread.id,
          user_id: user.id,
          message: message,
          sender_role: 'user'
        });

      if (messageError) throw new Error(messageError.message);

      return { thread: createdThread, message: messageData[0] };
    } catch (error) {
      throw error;
    }
  }
  
  static async getSupportMessages(payload) {
    try {
      const { threadId } = payload;
      
      // Получаем тред
      const { data: threadData, error: threadError } = await supabase
        .from('support_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError) throw new Error(threadError.message);

      // Получаем сообщения
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*, profiles(full_name)')
        .eq('thread_id', threadId);

      if (messagesError) throw new Error(messagesError.message);

      return {
        thread: threadData,
        messages: messagesData || []
      };
    } catch (error) {
      throw error;
    }
  }

  static async sendSupportMessage(payload) {
    try {
      const user = await this.me();
      const { threadId, message } = payload;

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          message: message,
          sender_role: user.role || 'user'
        });

      if (error) throw new Error(error.message);

      // Обновляем время последнего обновления треда
      await supabase
        .from('support_threads')
        .eq('id', threadId)
        .update({ updated_date: new Date().toISOString() });

      return data;
    } catch (error) {
      throw error;
    }
  }
  
  static async updateSupportThreadStatus(payload) {
    try {
      const { threadId, status } = payload;
      
      const { data, error } = await supabase
        .from('support_threads')
        .eq('id', threadId)
        .update({ status });

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // --- Админские методы: Данные ---
  static async loadEventsFromAPI() {
    try {
      // Это заглушка для реального вызова внешнего API спортивных событий.
      // В рабочем приложении здесь будет выполняться запрос к API
      // и обработка полученных данных.
      const mockEvents = [
        {
          external_id: 'api_event_mock_1',
          name: 'Футбол: Команда А против Команды Б',
          start_time: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // Через 24 часа
          sport: 'Футбол',
          status: 'scheduled',
          league: 'Пример Лига',
          // Дополнительные поля события, как определено в вашей базе данных
        },
        {
          external_id: 'api_event_mock_2',
          name: 'Баскетбол: Клуб В против Клуба Г',
          start_time: new Date(Date.now() + 3600 * 1000 * 48).toISOString(), // Через 48 часов
          sport: 'Баскетбол',
          status: 'scheduled',
          league: 'Баскетбольная Ассоциация',
        },
      ];

      // Используем upsert для вставки новых событий или обновления существующих
      // Предполагается, что 'external_id' является уникальным ключом в таблице 'events'.
      const { data, error } = await supabase
        .from('events')
        .upsert(mockEvents, { onConflict: 'external_id' });

      if (error) {
        throw new Error(error.message);
      }
      return { message: "События успешно загружены и обновлены.", data };
    } catch (error) {
      console.error("Ошибка при загрузке событий с API:", error.message);
      throw new Error("Не удалось загрузить события с API: " + error.message);
    }
  }

  static async updateOdds() {
    try {
      // Здесь должна быть логика вызова вашей серверной функции
      // Например, через fetch к эндпоинту функции
      return { message: "Функция обновления коэффициентов временно недоступна" };
    } catch (error) {
      throw error;
    }
  }

  static async processResults() {
    try {
      // Логика вызова серверной функции для обработки результатов
      return { message: "Функция обработки результатов временно недоступна" };
    } catch (error) {
      throw error;
    }
  }
}
