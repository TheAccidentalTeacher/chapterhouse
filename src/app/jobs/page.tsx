import { JobsDashboard } from "@/components/jobs-dashboard";
import Link from "next/link";

export const metadata = {
  title: "Job Runner — Chapterhouse",
  description: "Background AI jobs with live progress tracking.",
};

export default function JobsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Job Runner</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Background AI jobs. Results appear live — no refresh needed.
          </p>
        </div>
        <Link
          href="/curriculum-factory"
          className="text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
        >
          + New Job
        </Link>
      </div>

      <JobsDashboard />
    </div>
  );
}
