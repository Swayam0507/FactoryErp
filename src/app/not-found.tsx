import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-black text-slate-200 dark:text-slate-800 select-none">404</p>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
