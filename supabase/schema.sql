-- 用户档案表（扩展 Supabase Auth users）
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  ui_theme TEXT DEFAULT 'dark',
  audio_enabled BOOLEAN DEFAULT true,
  key_sound_profile TEXT DEFAULT 'mechanical-1',
  virtual_keyboard_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 游戏分数表
CREATE TABLE IF NOT EXISTS public.game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 课程轨道表
CREATE TABLE IF NOT EXISTS public.lesson_tracks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 课程表
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  track_id TEXT REFERENCES public.lesson_tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 课程内容表
CREATE TABLE IF NOT EXISTS public.lesson_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 打字会话表
CREATE TABLE IF NOT EXISTS public.typing_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT REFERENCES public.lessons(id),
  wpm INTEGER NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  correct_chars INTEGER DEFAULT 0,
  error_chars INTEGER DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  stars INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 打字事件表（用于详细分析）
CREATE TABLE IF NOT EXISTS public.typing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.typing_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'keypress', 'error', 'backspace', etc.
  key_code TEXT,
  timestamp_ms INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 用户课程进度表
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id TEXT REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  best_wpm INTEGER DEFAULT 0,
  best_accuracy DECIMAL(5,2) DEFAULT 0,
  best_stars INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON public.game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_name ON public.game_scores(game_name);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON public.game_scores(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_typing_sessions_user_id ON public.typing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_lesson_id ON public.typing_sessions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_started_at ON public.typing_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_typing_events_session_id ON public.typing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_typing_events_user_id ON public.typing_events(user_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);

-- Row Level Security (RLS) 策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own game scores" ON public.game_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game scores" ON public.game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own typing sessions" ON public.typing_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own typing sessions" ON public.typing_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own typing sessions" ON public.typing_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own typing events" ON public.typing_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own typing events" ON public.typing_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress" ON public.user_lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress" ON public.user_lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress" ON public.user_lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 课程数据对所有用户可读
ALTER TABLE public.lesson_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lesson tracks" ON public.lesson_tracks
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view lessons" ON public.lessons
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view lesson contents" ON public.lesson_contents
  FOR SELECT USING (true);

-- 创建函数自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at
  BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

