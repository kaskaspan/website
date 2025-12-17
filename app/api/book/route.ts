import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const supabase = await createClient();
    const { error } = await supabase.from('books').upsert(data);
    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Request handling error:', e);
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 400 });
  }
}
