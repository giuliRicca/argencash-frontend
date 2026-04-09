import Link from "next/link";

export function MissingSessionState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#0d1512_0%,_#101917_50%,_#0b100f_100%)] px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/8 bg-[#131917]/92 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
        <h1 className="text-3xl font-semibold text-stone-100">Sign in required</h1>
        <Link className="mt-6 inline-flex rounded-2xl bg-[#dbc9a3] px-5 py-3 font-medium text-[#141915] transition hover:bg-[#e5d5b3]" href="/">
          Back
        </Link>
      </div>
    </main>
  );
}
