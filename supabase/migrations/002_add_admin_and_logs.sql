-- Add is_admin flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view all logs
CREATE POLICY "Admins can view all activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for admin dashboard
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
  p.id,
  u.email,
  p.lemlist_api_key IS NOT NULL as has_api_key,
  p.is_admin,
  p.created_at,
  p.updated_at,
  (SELECT COUNT(*) FROM public.activity_logs al WHERE al.user_id = p.id) as activity_count,
  (SELECT MAX(created_at) FROM public.activity_logs al WHERE al.user_id = p.id) as last_activity_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;

-- Only admins can access this view
CREATE POLICY "Admins can view admin_users_view"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );
