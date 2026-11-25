"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Sparkles, X } from "lucide-react";
import { parseCvTextLocally, type ParsedCvDraft } from "@/lib/ai";

export function CvBuilderTrigger() {
  const [open, setOpen] = useState(false);
  const [rawCv, setRawCv] = useState("");
  const [draft, setDraft] = useState<ParsedCvDraft | null>(null);

  function handleAnalyze() {
    if (!rawCv.trim()) return;
    setDraft(parseCvTextLocally(rawCv));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>AI CV-to-Profile Builder</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-builder-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cv-builder-title" className="text-lg font-bold text-slate-900">
                  AI CV-to-Profile Builder
                </h2>
                <p className="text-xs text-slate-500">
                  Paste your CV text or portfolio summary to extract structured skills and proof links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="cv-text" className="block text-xs font-semibold text-slate-700">
                Paste CV / Resume text
              </label>
              <textarea
                id="cv-text"
                rows={5}
                value={rawCv}
                onChange={(e) => setRawCv(e.target.value)}
                placeholder="Paste your experience, tech stack (TypeScript, Next.js, PostgreSQL, Supabase...), and GitHub/portfolio URLs..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleAnalyze}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Extract Structured Draft</span>
              </button>
            </div>

            {draft && (
              <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <CheckCircle2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  <span>Structured Draft Ready (Review Before Saving)</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">Suggested Headline</span>
                  <p className="text-slate-900 mt-0.5">{draft.suggestedHeadline}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">Detected Skills</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {draft.detectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-white border border-teal-200 px-2.5 py-0.5 font-medium text-teal-900"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {draft.detectedUrls.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block">
                      Detected Proof-of-Work Links
                    </span>
                    <ul className="mt-1 space-y-1 text-teal-800">
                      {draft.detectedUrls.map((url) => (
                        <li key={url} className="truncate">
                          {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
