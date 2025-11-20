import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 检查环境变量...')
console.log('URL:', url ? '✅ 已设置' : '❌ 未设置')
console.log('Key:', key ? `✅ 已设置 (${key.substring(0, 20)}...)` : '❌ 未设置')
console.log('\n📝 提示: 请在 Supabase 仪表板的 Table Editor 中手动检查表是否创建成功')
console.log('   访问: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom/editor')
