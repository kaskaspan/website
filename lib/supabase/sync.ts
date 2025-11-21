import { createClient } from './client'
import type { TypingSessionRecord } from '@/lib/typing-analytics'
import type { UserScore } from '@/lib/user-storage'

// 同步打字会话到 Supabase
export async function syncTypingSession(record: TypingSessionRecord) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.warn('用户未登录，无法同步数据')
    return { success: false, message: '用户未登录' }
  }

  // 插入或更新打字会话
  const { error: sessionError } = await supabase
    .from('typing_sessions')
    .insert({
      user_id: user.id,
      lesson_id: record.lessonId,
      wpm: record.summary.wpm,
      accuracy: record.summary.accuracy,
      correct_chars: Math.round((record.summary.cpm * (record.summary.durationMs / 60000)) * (record.summary.accuracy / 100)),
      error_chars: Math.round((record.summary.cpm * (record.summary.durationMs / 60000)) * (record.summary.errorRate)),
      duration_ms: record.summary.durationMs,
      stars: record.summary.starRating,
      is_completed: true, // Assuming synced sessions are completed
      started_at: new Date(record.timestamp).toISOString(),
      completed_at: new Date(record.timestamp).toISOString(),
    })

  if (sessionError) {
    console.error('同步打字会话错误:', sessionError)
    return { success: false, message: sessionError.message }
  }

  // 更新课程进度
  if (record.lessonId) {
    await updateLessonProgress(user.id, record.lessonId, record.summary)
  }

  return { success: true }
}

interface LessonProgressUpdate {
  attempts: number
  updated_at: string
  best_wpm?: number
  best_accuracy?: number
  best_stars?: number
  completed_at?: string
}

// 更新课程进度
async function updateLessonProgress(
  userId: string,
  lessonId: string,
  summary: TypingSessionRecord['summary']
) {
  const supabase = createClient()

  // 检查是否已有进度记录
  const { data: existing } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single()

  if (existing) {
    // 更新现有记录
    const updates: LessonProgressUpdate = {
      attempts: existing.attempts + 1,
      updated_at: new Date().toISOString(),
    }

    if (summary.wpm > existing.best_wpm) {
      updates.best_wpm = summary.wpm
    }
    if (summary.accuracy > existing.best_accuracy) {
      updates.best_accuracy = summary.accuracy
    }
    if (summary.starRating > existing.best_stars) {
      updates.best_stars = summary.starRating
    }
    if (!existing.completed_at) {
      updates.completed_at = new Date().toISOString()
    }

    await supabase
      .from('user_lesson_progress')
      .update(updates)
      .eq('id', existing.id)
  } else {
    // 创建新记录
    await supabase
      .from('user_lesson_progress')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        best_wpm: summary.wpm,
        best_accuracy: summary.accuracy,
        best_stars: summary.starRating,
        attempts: 1,
        completed_at: new Date().toISOString(),
      })
  }
}

// 同步游戏分数到 Supabase
export async function syncGameScore(score: Omit<UserScore, 'id' | 'timestamp'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.warn('用户未登录，无法同步数据')
    return { success: false, message: '用户未登录' }
  }

  const { error } = await supabase
    .from('game_scores')
    .insert({
      user_id: user.id,
      game_name: score.game,
      score: score.score,
      metadata: {
        date: score.date,
        userAgent: score.userAgent,
      },
    })

  if (error) {
    console.error('同步游戏分数错误:', error)
    return { success: false, message: error.message }
  }

  // 更新用户档案的游戏统计
  await updateUserGameStats(user.id)

  return { success: true }
}

// 更新用户游戏统计
async function updateUserGameStats(userId: string) {
  const supabase = createClient()

  // 获取用户所有游戏分数
  const { data: scores } = await supabase
    .from('game_scores')
    .select('score')
    .eq('user_id', userId)

  if (!scores) return

  const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0)
  const gamesPlayed = scores.length

  // 更新用户档案
  await supabase
    .from('user_profiles')
    .update({
      total_score: totalScore,
      games_played: gamesPlayed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}

// 从 Supabase 获取用户打字会话
export async function getUserTypingSessions(limit = 50) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('typing_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('获取打字会话错误:', error)
    return []
  }

  return data || []
}

// 从 Supabase 获取用户游戏分数
export async function getUserGameScores(gameName?: string, limit = 50) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('game_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (gameName) {
    query = query.eq('game_name', gameName)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取游戏分数错误:', error)
    return []
  }

  return data || []
}

// 同步用户偏好设置
export async function syncUserPreferences(preferences: {
  ui_theme?: string
  audio_enabled?: boolean
  key_sound_profile?: string
  virtual_keyboard_enabled?: boolean
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, message: '用户未登录' }
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('同步用户偏好错误:', error)
    return { success: false, message: error.message }
  }

  return { success: true }
}

// 获取用户偏好设置
export async function getUserPreferences() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('获取用户偏好错误:', error)
    return null
  }

  return data
}

