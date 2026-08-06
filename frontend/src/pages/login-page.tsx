import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router";

const LoginPage: React.FC = () => {
  const { isLoading, isAuthenticated, signinRedirect } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      signinRedirect();
    }
  }, [isLoading, isAuthenticated, signinRedirect]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-zinc-200">Redirecting to login portal...</p>
        <div className="text-xs text-zinc-400 pt-2 border-t border-white/[0.06] w-full">
          Don't have an account yet?{" "}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
