// Простой клиент для работы с Supabase без внешних библиотек
const supabaseUrl = 'https://fdrbebuchkyiyovrcqrt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkcmJlYnVjaGt5aXlvdnJjcXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTUyODEsImV4cCI6MjA3MTI5MTI4MX0.WMJIbNmCHIpC5tV10buX755hg7jRpORgi0EQKqqHprQ';

// Класс для построения запросов
class SupabaseQueryBuilder {
  constructor(tableName) {
    this._tableName = tableName;
    this._filters = [];
    this._selectColumns = '*';
    this._isSingle = false;
    this._orderBy = null;
    this._limit = null;
  }

  select(columns = '*') {
    this._selectColumns = columns;
    return this;
  }

  eq(column, value) {
    this._filters.push({ column, operator: 'eq', value });
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  order(column, options = {}) {
    this._orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  // Делаем объект "thenable" для поддержки await
  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }

  async insert(data) {
    return this._executeInsert(data);
  }

  async update(data) {
    return this._executeUpdate(data);
  }

  async delete() {
    return this._executeDelete();
  }

  async _execute() {
    try {
      let url = `${supabaseUrl}/rest/v1/${this._tableName}`;
      const queryParams = new URLSearchParams();

      // Добавляем select
      if (this._selectColumns !== '*') {
        queryParams.set('select', this._selectColumns);
      }

      // Добавляем фильтры
      this._filters.forEach(filter => {
        queryParams.set(filter.column, `${filter.operator}.${filter.value}`);
      });

      // Добавляем сортировку
      if (this._orderBy) {
        queryParams.set('order', `${this._orderBy.column}.${this._orderBy.ascending ? 'asc' : 'desc'}`);
      }

      // Добавляем лимит
      if (this._limit) {
        queryParams.set('limit', this._limit.toString());
      }

      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }

      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      };

      if (this._isSingle) {
        headers['Accept'] = 'application/vnd.pgrst.object+json';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase error:', errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      let data = null;
      const responseText = await response.text();
      if (responseText) {
        data = JSON.parse(responseText);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Query execution error:', error);
      return { data: null, error: error.message };
    }
  }

  async _executeInsert(data) {
    try {
      const url = `${supabaseUrl}/rest/v1/${this._tableName}`;
      
      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Insert error:', errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      let responseData = null;
      const responseText = await response.text();
      if (responseText) {
        responseData = JSON.parse(responseText);
      }

      return { data: responseData, error: null };
    } catch (error) {
      console.error('Insert execution error:', error);
      return { data: null, error: error.message };
    }
  }

  async _executeUpdate(data) {
    try {
      let url = `${supabaseUrl}/rest/v1/${this._tableName}`;
      
      // Добавляем фильтры в URL для update
      if (this._filters.length > 0) {
        const queryParams = new URLSearchParams();
        this._filters.forEach(filter => {
          queryParams.set(filter.column, `${filter.operator}.${filter.value}`);
        });
        url += '?' + queryParams.toString();
      }

      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error:', errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      let responseData = null;
      const responseText = await response.text();
      if (responseText) {
        responseData = JSON.parse(responseText);
      }

      return { data: responseData, error: null };
    } catch (error) {
      console.error('Update execution error:', error);
      return { data: null, error: error.message };
    }
  }

  async _executeDelete() {
    try {
      let url = `${supabaseUrl}/rest/v1/${this._tableName}`;
      
      // Добавляем фильтры в URL для delete
      if (this._filters.length > 0) {
        const queryParams = new URLSearchParams();
        this._filters.forEach(filter => {
          queryParams.set(filter.column, `${filter.operator}.${filter.value}`);
        });
        url += '?' + queryParams.toString();
      }

      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error:', errorText);
        return { data: null, error: `HTTP ${response.status}: ${errorText}` };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Delete execution error:', error);
      return { data: null, error: error.message };
    }
  }
}

// Главный клиент Supabase
export const supabase = {
  from(tableName) {
    return new SupabaseQueryBuilder(tableName);
  }
};

// Функции для работы с авторизацией
export const authHelpers = {
  // Регистрация пользователя
  async register(username, password, promoCode) {
    try {
      console.log('Начинаем регистрацию:', { username, promoCode });

      // Проверяем промокод
      console.log('Проверяем промокод...');
      const { data: promoData, error: promoError } = await supabase
        .from('promo_codes')
        .eq('code', promoCode)
        .eq('is_active', true);

      console.log('Результат проверки промокода:', { promoData, promoError });

      if (promoError) {
        console.error('Ошибка при проверке промокода:', promoError);
        throw new Error('Ошибка при проверке промокода: ' + promoError);
      }

      if (!promoData || promoData.length === 0) {
        throw new Error('Неверный промокод');
      }

      const promo = promoData[0];

      // Проверяем, не использован ли промокод максимальное количество раз
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        throw new Error('Промокод исчерпан');
      }

      // Проверяем, не истек ли промокод
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        throw new Error('Промокод истек');
      }

      // Проверяем, не занят ли логин
      console.log('Проверяем уникальность логина...');
      const { data: existingUser, error: userCheckError } = await supabase
        .from('profiles')
        .eq('username', username);

      console.log('Результат проверки логина:', { existingUser, userCheckError });

      if (userCheckError) {
        console.error('Ошибка при проверке логина:', userCheckError);
        throw new Error('Ошибка при проверке логина: ' + userCheckError);
      }

      if (existingUser && existingUser.length > 0) {
        throw new Error('Логин уже занят');
      }

      // Хешируем пароль
      const hashedPassword = btoa(password);

      // Создаем пользователя
      console.log('Создаем пользователя...');
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .insert({
          username: username,
          password_hash: hashedPassword,
          promo_code: promoCode,
          role: promo.user_role,
          balance: promo.bonus_balance || 0,
          status: 'pending',
          full_name: username,
          email: `${username}@temp.local`
        });

      console.log('Результат создания пользователя:', { userData, userError });

      if (userError) {
        console.error('Ошибка при создании пользователя:', userError);
        throw new Error('Ошибка при создании пользователя: ' + userError);
      }

      // Увеличиваем счетчик использований промокода
      console.log('Обновляем счетчик промокода...');
      const { error: updateError } = await supabase
        .from('promo_codes')
        .eq('id', promo.id)
        .update({ used_count: promo.used_count + 1 });

      if (updateError) {
        console.error('Ошибка при обновлении промокода:', updateError);
        // Не прерываем процесс, так как пользователь уже создан
      }

      console.log('Регистрация завершена успешно');
      return userData && userData.length > 0 ? userData[0] : { username };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  },

  // Вход пользователя
  async login(username, password) {
    try {
      console.log('Начинаем вход:', { username });
      
      const hashedPassword = btoa(password);
      
      const { data: userData, error } = await supabase
        .from('profiles')
        .eq('username', username)
        .eq('password_hash', hashedPassword);

      console.log('Результат входа:', { userData, error });

      if (error) {
        console.error('Ошибка при входе:', error);
        throw new Error('Ошибка при входе: ' + error);
      }

      if (!userData || userData.length === 0) {
        throw new Error('Неверный логин или пароль');
      }

      const user = userData[0];

      // Сохраняем данные пользователя в localStorage
      localStorage.setItem('supabase_user', JSON.stringify(user));
      localStorage.setItem('supabase_session', JSON.stringify({
        user: user,
        access_token: 'custom_token_' + user.id,
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
      }));

      console.log('Вход выполнен успешно');
      return user;
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  },

  // Получить текущего пользователя
  async getCurrentUser() {
    try {
      const session = localStorage.getItem('supabase_session');
      if (!session) return null;

      const sessionData = JSON.parse(session);
      
      // Проверяем, не истекла ли сессия
      if (sessionData.expires_at < Date.now()) {
        localStorage.removeItem('supabase_user');
        localStorage.removeItem('supabase_session');
        return null;
      }

      return sessionData.user;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }
  },

  // Выход пользователя
  async logout() {
    localStorage.removeItem('supabase_user');
    localStorage.removeItem('supabase_session');
  },

  // Обновить данные пользователя
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .eq('id', userId)
        .update(updates);

      if (error) throw new Error(error);

      // Обновляем localStorage если есть данные
      if (data && data.length > 0) {
        const updatedUser = data[0];
        localStorage.setItem('supabase_user', JSON.stringify(updatedUser));
        const session = JSON.parse(localStorage.getItem('supabase_session'));
        session.user = updatedUser;
        localStorage.setItem('supabase_session', JSON.stringify(session));
        return updatedUser;
      }

      return updates;
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      throw error;
    }
  }
};