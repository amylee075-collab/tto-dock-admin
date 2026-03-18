import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?redirectTo=/reset-password&message=비밀번호를 변경하려면 먼저 이메일의 재설정 링크를 클릭하세요."
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff5f0] px-4">
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
