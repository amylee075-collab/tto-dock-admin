import { isSupabaseConfigured } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const needSetup = !isSupabaseConfigured();

  return <LoginForm needSetup={needSetup} />;
}
