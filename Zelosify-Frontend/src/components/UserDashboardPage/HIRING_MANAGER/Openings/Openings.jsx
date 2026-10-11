
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1/hiring-manager";

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function HiringManagerOpenings() {
  const router = useRouter();

  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchResumes() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/openings?page=1&pageSize=100`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load openings.");
        }

        const payload = result.data ?? result;

        const openings = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.openings)
            ? payload.openings
            : [];

        const profileGroups = await Promise.all(
          openings.map(async (opening) => {
            const profileResponse = await fetch(
              `${API_BASE}/openings/${encodeURIComponent(opening.id)}?page=1&pageSize=100`,
              {
                credentials: "include",
                signal: controller.signal,
              }
            );

            const profileResult = await profileResponse.json();

            if (!profileResponse.ok) {
              throw new Error(
                profileResult.message ||
                  `Unable to load resumes for ${opening.title || opening.id}.`
              );
            }

            const profilePayload =
              profileResult.data ?? profileResult;

            return (profilePayload.profiles ?? []).map((profile) => ({
              ...profile,
              openingId: opening.id,
              openingTitle: opening.title || "Untitled opening",
              fileName:
                profile.fileName ??
                profile.filename ??
                profile.s3Key?.split("/").pop() ??
                `Profile #${profile.id}`,
              uploadedAt:
                profile.uploadedAt ?? profile.submittedAt,
            }));
          })
        );

        if (!controller.signal.aborted) {
          setProfiles(profileGroups.flat());
          setPage(1);
        }
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          setError(err.message || "Unable to load vendor resumes.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchResumes();

    return () => controller.abort();
  }, [retry]);

  const filteredProfiles = profiles.filter((profile) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      profile.fileName,
      profile.openingTitle,
      profile.status,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );

    return (
      matchesSearch &&
      (statusFilter === "ALL" || profile.status === statusFilter)
    );
  });

  const totalPages = Math.ceil(filteredProfiles.length / pageSize);

  const currentProfiles = filteredProfiles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function openProfile(profile) {
    if (!profile.openingId) {
      setError("This resume has no associated opening ID.");
      return;
    }

    router.push(
      `/hiring-manager/openings/${encodeURIComponent(profile.openingId)}`
    );
  }

  return (
    <main className="min-h-screen bg-background px-2 text-foreground">
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Vendor Uploaded Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View resumes submitted for your assigned openings.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search resumes or openings"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm sm:w-72"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background p-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 p-4 text-sm text-red-600">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-tableHeader">
              <tr>
                {[
                  "Resume",
                  "Associated Opening",
                  "Upload Date",
                  "Status",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-primary"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm">
                    Loading vendor resumes...
                  </td>
                </tr>
              ) : currentProfiles.length === 0 && !error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No vendor resumes found.
                  </td>
                </tr>
              ) : (
                currentProfiles.map((profile) => (
                  <tr
                    key={`${profile.openingId}-${profile.id}`}
                    onClick={() => openProfile(profile)}
                    className="cursor-pointer hover:bg-tableHeader"
                  >
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <span className="break-all font-medium">
                          {profile.fileName}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {profile.openingTitle}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      {formatDate(profile.uploadedAt)}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {profile.status || "Unknown"}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProfile(profile);
                        }}
                        className="whitespace-nowrap rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      >
                        View profiles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                {filteredProfiles.length === 0
                  ? 0
                  : (page - 1) * pageSize + 1}
                {"–"}
                {Math.min(page * pageSize, filteredProfiles.length)}
                {" of "}
                {filteredProfiles.length} resumes
              </span>

              <label className="flex items-center gap-2">
                Rows
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-border bg-background p-2"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-md border border-border px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page {page} of {Math.max(totalPages, 1)}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || totalPages === 0}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-border px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
