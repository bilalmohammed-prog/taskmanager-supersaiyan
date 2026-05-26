import { Button } from "./ui/button";

type AuthCardProps = {
  oauthError: string | null;
  oauthPending: boolean;
  onGoogleSignIn: () => Promise<void> | void;
};

export function AuthCard({ oauthError, oauthPending, onGoogleSignIn }: AuthCardProps) {
  return (
    <div className="flex w-full items-center justify-center lg:w-[42%]">
      <div className="w-full max-w-sm rounded-3xl border border-[#E7E4F8] bg-white p-8 shadow-[0_40px_80px_-60px_rgba(91,61,245,0.8)]">
        <div className="text-xl font-semibold text-slate-900">Get started</div>
        <div className="mt-2 text-sm text-slate-500">Sign in to your workspace.</div>

        <div className="mt-8 space-y-4">
          {oauthError && <p className="text-sm font-medium text-red-600">{oauthError}</p>}
          <Button
            type="button"
            onClick={() => {
              void onGoogleSignIn();
            }}
            disabled={oauthPending}
            className="h-12 w-full rounded-xl bg-[#5B3DF5] text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(91,61,245,0.8)] hover:bg-[#4B32E3]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M21.5 12.2c0-.7-.1-1.4-.3-2H12v3.8h5.3a4.5 4.5 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 22c2.7 0 5-1 6.7-2.7l-3.2-2.5c-.9.6-2 1-3.5 1-2.6 0-4.9-1.8-5.7-4.2H2.9v2.6A10 10 0 0 0 12 22Z"
                  fill="#34A853"
                />
                <path
                  d="M6.3 13.6a6 6 0 0 1 0-3.2V7.8H2.9a10 10 0 0 0 0 8.4l3.4-2.6Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 6.6c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.8 9.8 0 0 0 12 2a10 10 0 0 0-9.1 5.8l3.4 2.6C7.1 8.3 9.4 6.6 12 6.6Z"
                  fill="#EA4335"
                />
              </svg>
            </span>
            {oauthPending ? "Connecting..." : "Continue with Google"}
          </Button>
          <p className="text-center text-xs text-slate-400">No password required.</p>
        </div>
      </div>
    </div>
  );
}
