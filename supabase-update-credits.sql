-- 更新现有用户积分从5000到3000
-- 如果用户还没用过积分，直接更新余额
UPDATE public.credits SET balance = 3000 WHERE balance = 5000;

-- 记录调整
INSERT INTO public.credit_transactions (user_id, amount, type, description)
SELECT user_id, -2000, 'deduct', '积分调整：初始赠送从5000调整为3000'
FROM public.credits WHERE balance = 3000 AND NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct WHERE ct.user_id = credits.user_id AND ct.description = '积分调整：初始赠送从5000调整为3000'
);