/**
 * 测试 Supabase 连接脚本
 * 运行: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '../lib/supabase/client'

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...\n')

  // 检查环境变量
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('❌ 错误: 环境变量未设置')
    console.log('请确保 .env.local 文件包含:')
    console.log('  NEXT_PUBLIC_SUPABASE_URL=...')
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
    process.exit(1)
  }

  console.log('✅ 环境变量已设置')
  console.log(`   URL: ${url}`)
  console.log(`   Key: ${key.substring(0, 20)}...\n`)

  try {
    const supabase = createClient()

    // 测试连接
    console.log('📡 测试数据库连接...')
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  数据库表尚未创建')
        console.log('   请在 Supabase SQL Editor 中运行 supabase/schema.sql\n')
      } else {
        console.error('❌ 连接错误:', error.message)
        console.error('   错误代码:', error.code)
        process.exit(1)
      }
    } else {
      console.log('✅ 数据库连接成功！\n')
    }

    // 测试认证服务
    console.log('🔐 测试认证服务...')
    const { data: authData, error: authError } = await supabase.auth.getSession()

    if (authError) {
      console.log('⚠️  认证服务:', authError.message)
    } else {
      console.log('✅ 认证服务正常\n')
    }

    console.log('✨ 所有测试完成！')
    console.log('\n下一步:')
    console.log('1. 在 Supabase SQL Editor 中运行 supabase/schema.sql')
    console.log('2. 重启开发服务器: npm run dev')
    console.log('3. 访问 /login 页面测试登录功能')

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

testConnection()

