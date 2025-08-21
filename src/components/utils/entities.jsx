import { supabase, handleSupabaseError } from './supabaseClient.js'

// Базовый класс для работы с сущностями
class BaseEntity {
  constructor(tableName) {
    this.tableName = tableName
  }

  async list(orderBy = 'created_date', limit = null) {
    try {
      let query = supabase.from(this.tableName).select('*')
      
      if (orderBy.startsWith('-')) {
        query = query.order(orderBy.substring(1), { ascending: false })
      } else {
        query = query.order(orderBy, { ascending: true })
      }
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async filter(conditions = {}, orderBy = 'created_date', limit = null) {
    try {
      let query = supabase.from(this.tableName).select('*')
      
      // Применяем условия фильтрации
      Object.entries(conditions).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'object' && value.$in) {
          query = query.in(key, value.$in)
        } else {
          query = query.eq(key, value)
        }
      })
      
      if (orderBy.startsWith('-')) {
        query = query.order(orderBy.substring(1), { ascending: false })
      } else {
        query = query.order(orderBy, { ascending: true })
      }
      
      if (limit) {
        query = query.limit(limit)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async create(data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return result
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async bulkCreate(dataArray) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dataArray)
        .select()
      
      if (error) throw error
      return data || []
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async update(id, data) {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return result
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return true
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
}

// Специальный класс для работы с пользователями
class UserEntity extends BaseEntity {
  constructor() {
    super('profiles')
  }

  async me() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не авторизован')
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      return {
        ...profile,
        email: user.email,
        full_name: user.user_metadata?.full_name || profile.full_name
      }
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async updateMyUserData(data) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не авторизован')
      
      const { data: result, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      return result
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async login() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async loginWithRedirect(callbackUrl) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      })
      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      throw new Error(handleSupabaseError(error))
    }
  }
}

// Экспорт сущностей
export const Event = new BaseEntity('events')
export const Bet = new BaseEntity('bets')
export const BalanceTransaction = new BaseEntity('balance_transactions')
export const SupportThread = new BaseEntity('support_threads')
export const SupportMessage = new BaseEntity('support_messages')
export const AppSettings = new BaseEntity('app_settings')
export const PromoCode = new BaseEntity('promo_codes')
export const User = new UserEntity()