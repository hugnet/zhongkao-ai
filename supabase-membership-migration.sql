-- ============================================
-- 中考提分AI私教 - 会员与每日限额迁移
-- 在 Supabase Dashboard -> SQL Editor 中执行
-- ============================================

-- 1. 每日使用记录表
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON public.daily_usage(user_id, usage_date);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_daily_usage_policy ON public.daily_usage
  FOR ALL USING (auth.uid() = user_id);

-- 2. 原子积分扣除函数（防止并发超扣）
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
) RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT) AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  SELECT balance INTO v_current_balance
  FROM public.credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, '积分记录不存在'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, '积分不足'::TEXT;
    RETURN;
  END IF;

  UPDATE public.credits
  SET balance = balance - p_amount,
      total_used = total_used + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'deduct', p_description);

  RETURN QUERY SELECT TRUE, v_current_balance - p_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 查询用户会员计划函数
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY expires_at DESC
  LIMIT 1;

  RETURN COALESCE(v_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 查询今日消息数函数
CREATE OR REPLACE FUNCTION public.get_daily_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.credit_transactions
  WHERE user_id = p_user_id
    AND type = 'deduct'
    AND created_at >= date_trunc('day', NOW());

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 增加今日消息数
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  INSERT INTO public.daily_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = public.daily_usage.message_count + 1;

  SELECT message_count INTO v_new_count
  FROM public.daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
