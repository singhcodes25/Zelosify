
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FileUp,
  MapPin,
  Trash2,
  UploadCloud,
  UserRound,
  Eye,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const VENDOR_API = `${API_BASE}/api/v1/vendor`;


async function parseResponse(response) {
  const result = await response.json();


  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}

export default function OpeningDetailsLayout({ opId }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [opening, setOpening] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openingUrl = `${VENDOR_API}/openings/${encodeURIComponent(
    opId || "",
  )}`;
  async function loadOpening() {
    const response = await fetch(openingUrl, {
      credentials: "include",
    });

    const result = await parseResponse(response);
    const data = result.data ?? result;

    setOpening(data.opening ?? data);
    setFiles(data.files ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!opId) {
        setError("Opening ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(openingUrl, {
          credentials: "include",
        });

        const result = await parseResponse(response);
        const data = result.data ?? result;

        if (!cancelled) {
          setOpening(data.opening ?? data);
          setFiles(data.files ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load opening details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [opId]); // eslint-disable-line react-hooks/exhaustive-deps

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);

    setSelectedFiles((previous) => {
      const existing = new Set(
        previous.map((file) => `${file.name}-${file.size}`),
      );

      return [
        ...previous,
        ...incoming.filter(
          (file) => !existing.has(`${file.name}-${file.size}`),
        ),
      ];
    });

    setError("");
    setSuccess("");
  }

  async function uploadFiles() {
    if (!selectedFiles.length || uploading) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      for (const file of selectedFiles) {
        // 1. Request a presigned S3 URL.
        const presignResponse = await fetch(`${openingUrl}/profiles/presign`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [
              {
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
                size: file.size,
              },
            ],
          }),
        });

        const presignResult = await parseResponse(presignResponse);
        const upload = presignResult.data?.[0];

        if (!upload?.uploadUrl || !upload?.s3Key) {
          throw new Error(`Invalid upload details for ${file.name}.`);
        }

        // 2. Upload the file directly to S3.
        const s3Response = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!s3Response.ok) {
          throw new Error(`S3 upload failed for ${file.name}.`);
        }

        // 3. Save the uploaded file record in the backend.
        const saveResponse = await fetch(`${openingUrl}/profiles/upload`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [{ s3Key: upload.s3Key }],
          }),
        });

        await parseResponse(saveResponse);
      }

      setSelectedFiles([]);
      await loadOpening();
      setSuccess("Profiles uploaded successfully.");
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function softDeleteFile(fileId) {
    if (!window.confirm("Move this file to deleted items?")) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${VENDOR_API}/profiles/${encodeURIComponent(fileId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      await parseResponse(response);

      setFiles((previous) => previous.filter((file) => file.id !== fileId));

      setSuccess("File moved to deleted items.");
    } catch (err) {
      setError(err.message || "Unable to delete file.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-6 transition-colors dark:bg-slate-950 md:p-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-7 w-64 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-4 h-4 w-40 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-14 rounded bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!opening) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-6 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error || "Opening not found."}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-5 inline-flex items-center gap-2 text-sm text-blue-700 hover:underline dark:text-blue-400"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-4 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page navigation */}
        <button
          onClick={() => router.push("/vendor/openings")}
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to openings
        </button>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {/* Opening details */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opening details
              </p>

              <h1 className="break-words text-2xl font-normal text-slate-900 dark:text-slate-100 md:text-3xl">
                {opening.title || "Untitled opening"}
              </h1>

              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={16} />
                {opening.location || "Location not specified"}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {opening.status || "OPEN"}
            </span>
          </div>

          <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              icon={<BriefcaseBusiness size={17} />}
              label="Contract type"
              value={opening.contractType}
            />

            <Detail
              icon={<UserRound size={17} />}
              label="Experience"
              value={`${opening.experienceMin ?? 0}–${opening.experienceMax ?? "Not specified"} years`}
            />

            <Detail
              icon={<CalendarDays size={17} />}
              label="Posted date"
              value={
                opening.postedDate
                  ? new Date(opening.postedDate).toLocaleDateString()
                  : "—"
              }
            />

            <Detail
              icon={<UserRound size={17} />}
              label="Hiring manager"
              value={opening.hiringManagerName || "Not provided"}
            />

            <Detail
              icon={<Clock size={17} />}
              label="Expected completion"
              value={
                opening.expectedCompletionDate
                  ? new Date(opening.expectedCompletionDate).toLocaleDateString()
                  : "—"
              }
            />
          </div>

          <div className="mt-7 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">
              Job description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
              {opening.description || "No description provided."}
            </p>
          </div>
        </section>

        {/* Upload section */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <FileUp size={21} />
            </div>
            <div>
              <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">
                Upload profiles
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add candidate resumes for this opening.
              </p>
            </div>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={`mt-6 rounded-xl border-2 border-dashed px-5 py-10 text-center transition ${
              dragging
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                : "border-slate-300 bg-slate-50 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-500"
            }`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
              <UploadCloud size={25} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-200">
              Drag and drop resumes here
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Or browse files from your computer
            </p>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              PDF and Word documents · Maximum 10 MB per file
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Browse files
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Selected files
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedFiles.length} file(s)
                </span>
              </div>

              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText size={20} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className="break-all text-sm text-slate-800 dark:text-slate-200">
                          {file.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() =>
                        setSelectedFiles((previous) =>
                          previous.filter((_, i) => i !== index),
                        )
                      }
                      className="shrink-0 rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={uploadFiles}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={17} />
                      Upload profiles
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Uploaded files */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <FileText size={21} />
              </div>
              <div>
                <h2 className="text-base font-medium text-slate-900 dark:text-slate-100">
                  Uploaded profiles
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Files attached to this opening
                </p>
              </div>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {files.length} file(s)
            </span>
          </div>

          {files.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
              <FileText size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                No profiles uploaded yet
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Uploaded resumes will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="break-all text-sm text-slate-800 dark:text-slate-200">
                        {file.fileName || file.s3Key || "Uploaded file"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {file.submittedAt
                          ? new Date(file.submittedAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => softDeleteFile(file.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        {icon}
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 break-words text-sm text-slate-800 dark:text-slate-200">
        {value || "—"}
      </p>
    </div>
  );
}
