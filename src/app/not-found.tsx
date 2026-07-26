import type { Metadata } from "next";
import { FileQuestion, Home } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you were looking for doesn't exist.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid min-h-[calc(100vh-10rem)] place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 grid size-48 place-items-center">
          <div className="absolute inset-0 rounded-full bg-emerald-100/70 blur-2xl" />
          <div className="relative grid size-32 place-items-center rounded-full border border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50 shadow-lg">
            <FileQuestion className="size-16 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-slate-950 sm:text-5xl">
          404 - Page Not Found
        </h1>
        <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
          Oops! It looks like you've ventured into uncharted territory. The page
          you were looking for doesn't exist.
        </p>
        <div className="mt-8">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-extrabold text-white shadow-[0_16px_32px_rgb(16_185_129_/_24%)] hover:bg-emerald-700"
            href="/"
          >
            <Home size={18} />
            Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
