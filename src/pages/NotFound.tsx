import { useLocation } from "react-router";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-navy">404</h1>
        <p className="mb-4 text-xl text-ink-muted">Oops! Page not found</p>
        <a href="/dashboard" className="text-gold-dark underline hover:text-gold-deep">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
