import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif tracking-wider text-[#D4AF37]">
            MedNexus v2
          </h1>
          <p className="text-gray-500 text-sm mt-2">Identify yourself.</p>
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="doctor@nexus.com"
              required
              className="w-full bg-[#050505] border border-white/10 rounded p-3 text-gray-200 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full bg-[#050505] border border-white/10 rounded p-3 text-gray-200 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <button
            formAction={login}
            className="mt-4 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] py-3 rounded font-medium transition-all uppercase tracking-wide text-sm"
          >
            Enter Portal
          </button>

          {searchParams?.message && (
            <p className="text-red-400 text-xs text-center mt-4 bg-red-900/10 p-2 rounded border border-red-900/20">
              {searchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}