import { AuthWorkspace } from "@/components/auth-workspace";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_48%,_#0b100f_100%)] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <AuthWorkspace />
      </div>
    </main>
  );
}
