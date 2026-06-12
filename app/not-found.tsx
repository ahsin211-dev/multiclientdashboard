import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">Page not found</h2>
      <p className="mt-1 text-sm text-slate-600">The resource you requested could not be found.</p>
      <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
