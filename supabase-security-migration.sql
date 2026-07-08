-- 修复：移除注册时自动发放积分的触发器（防止假邮箱白嫖）
DROP TRIGGER IF EXISTS on_auth_user_credits ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_credits();

-- 新函数：只在邮箱确认后才发放积分和创建设置
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger AS 
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL) THEN
    INSERT INTO public.credits (user_id, balance)
    VALUES (NEW.id, 5000)
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 5000, 'grant', '邮箱验证后赠送');
    INSERT INTO public.user_settings (user_id, use_default_api)
    VALUES (NEW.id, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_confirmed();

-- 匿名使用追踪表
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint text NOT NULL,
  ip_address text DEFAULT '',
  message_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_usage_fp ON public.anonymous_usage(fingerprint);

ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_usage_policy ON public.anonymous_usage FOR ALL USING (true);
