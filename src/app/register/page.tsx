import { AuthWorkspace } from "@/components/auth-workspace";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page-gradient)] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <AuthWorkspace initialMode="register" />
      </div>
    </main>
  );
}
