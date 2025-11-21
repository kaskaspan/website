import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  username: string
  email?: string
  avatar?: string
  loginTime: number
}

// 登录（使用邮箱/密码或用户名）
export async function loginWithEmail(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, message: error.message }
  }

  if (data.user) {
    // 确保用户档案存在
    await ensureUserProfile(data.user)
    
    return {
      success: true,
      message: '登录成功！',
      user: await getUserFromSupabase(data.user),
    }
  }

  return { success: false, message: '登录失败' }
}

// 使用 Google 登录
export async function loginWithGoogle() {
  const supabase = createClient()
  
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : undefined

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data }
}

// 注册新用户
export async function signUp(email: string, password: string, username: string) {
  const supabase = createClient()
  
  // 获取当前 URL 用于重定向
  const redirectTo = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback?next=/login`
    : undefined
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  if (data.user) {
    // 创建用户档案
    await createUserProfile(data.user.id, username, email)
    
    return {
      success: true,
      message: '注册成功！请检查您的邮箱以验证账户。',
      user: await getUserFromSupabase(data.user),
    }
  }

  return { success: false, message: '注册失败' }
}

// 登出
export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('登出错误:', error)
  }
  
  // 清除本地存储
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('isLoggedIn')
  }
}

// 获取当前用户
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  return getUserFromSupabase(user)
}

// 检查是否已认证
export async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// 从 Supabase User 转换为 AuthUser
async function getUserFromSupabase(user: User): Promise<AuthUser> {
  const supabase = createClient()
  
  // 获取用户档案
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()
  
  return {
    id: user.id,
    username: profile?.username || user.email?.split('@')[0] || '用户',
    email: user.email,
    avatar: profile?.avatar_url,
    loginTime: Date.now(),
  }
}

// 确保用户档案存在
async function ensureUserProfile(user: User) {
  const supabase = createClient()
  
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (!existing) {
    const username = user.user_metadata?.username || user.email?.split('@')[0] || '用户'
    await createUserProfile(user.id, username, user.email)
  }
}

// 创建用户档案
async function createUserProfile(userId: string, username: string, email?: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      username,
      email,
    })
  
  if (error) {
    console.error('创建用户档案错误:', error)
    return
  }
  
  // 创建默认偏好设置
  await supabase
    .from('user_preferences')
    .insert({
      id: userId,
    })
}

// 使用用户名登录（兼容旧系统）
export async function loginWithUsername(username: string) {
  // 注意：Supabase 不支持直接用户名登录
  // 这里我们使用一个临时方案：查找用户邮箱或创建临时账户
  // 在生产环境中，应该要求用户使用邮箱登录
  
  const supabase = createClient()
  
  // 尝试查找用户档案
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('username', username)
    .single()
  
  if (profile) {
    // 如果找到用户，提示使用邮箱登录
    return {
      success: false,
      message: '请使用邮箱登录。如果您还没有账户，请先注册。',
    }
  }
  
  // 临时方案：创建一个演示账户（仅用于开发）
  // 在生产环境中应该禁用此功能
  if (process.env.NODE_ENV === 'development') {
    const tempEmail = `${username}@demo.local`
    const tempPassword = 'demo123'
    
    // 尝试注册
    const signUpResult = await signUp(tempEmail, tempPassword, username)
    if (signUpResult.success) {
      // 自动登录
      return loginWithEmail(tempEmail, tempPassword)
    }
    
    // 如果注册失败，尝试登录
    return loginWithEmail(tempEmail, tempPassword)
  }
  
  return {
    success: false,
    message: '请使用邮箱和密码登录。',
  }
}

// 更新用户头像
export async function updateUserAvatar(userId: string, avatarUrl: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
  
  if (error) {
    console.error('更新头像失败:', error)
    return { success: false, message: error.message }
  }
  
  return { success: true }
}

