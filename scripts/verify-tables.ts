/**
 * 验证 Supabase 表是否创建成功
 * 运行: npx tsx scripts/verify-tables.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local 文件
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '../lib/supabase/client'

async function verifyTables() {
  console.log('🔍 验证数据库表...\n')

  const supabase = createClient()
  const tables = [
    'user_profiles',
    'user_preferences',
    'game_scores',
    'lesson_tracks',
    'lessons',
    'lesson_contents',
    'typing_sessions',
    'typing_events',
    'user_lesson_progress',
  ]

  let allSuccess = true

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      
      if (error) {
        console.error(`❌ ${table}:`, error.message)
        allSuccess = false
      } else {
        console.log(`✅ ${table}`)
      }
    } catch (err: any) {
      console.error(`❌ ${table}:`, err.message)
      allSuccess = false
    }
  }

  console.log('\n' + '='.repeat(50))
  
  if (allSuccess) {
    console.log('✨ 所有表都已成功创建！')
    console.log('\n下一步:')
    console.log('1. 重启开发服务器: npm run dev')
    console.log('2. 访问 /login 页面')
    console.log('3. 注册一个新用户测试')
    console.log('4. 检查 Supabase 仪表板中的 user_profiles 表')
  } else {
    console.log('⚠️  部分表可能有问题，请检查错误信息')
  }
}

verifyTables()

