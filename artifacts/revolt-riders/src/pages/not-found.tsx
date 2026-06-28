import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white mb-2">404</h1>
        <p className="text-[#71717A] text-sm mb-6">Page not found</p>
        <Link href="/">
          <a className="btn-purple px-5 py-2.5 text-sm rounded-xl inline-block">Back to Dashboard</a>
        </Link>
      </div>
    </div>
  );
}
