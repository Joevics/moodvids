import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn(`404 Error: Attempted to access ${location.pathname}`);
    document.title = "404 - Page Not Found | MoodVids";
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
      <Link
        to="/"
        className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        aria-label="Return to Home"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
