
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  MapPin,
  Search,
  Users,
  X,
  RefreshCw,
} from "lucide-react";

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

// API scores may be fractions (0–1) or percentages (0–100).
function formatPercent(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";

  const number = Number(value);
  const percentage = number >= 0 && number <= 1 ? number * 100 : number;

  return `${Math.round(percentage)}%`;
}

function getDecisionStyle(decision) {
  switch (decision) {
    case "RECOMMENDED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300";
    case "BORDERLINE":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
    case "NOT_RECOMMENDED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function getDecisionLabel(decision) {
  switch (decision) {
    case "RECOMMENDED":
      return "Recommended";
    case "BORDERLINE":
      return "Borderline";
    case "NOT_RECOMMENDED":
      return "Not Recommended";
    default:
      return "Pending evaluation";
  }
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-background p-5">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
      </div>
      <div className="mt-5 h-16 rounded-lg bg-muted" />
      <div className="mt-4 flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-muted" />
        <div className="h-10 flex-1 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      <p className="mt-2 break-words text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function ProfileCard({ profile, onDecision, actionLoading }) {
  const recommendation = profile.recommendation ?? {};

  const decision =
    recommendation.decision ?? profile.decision ?? null;
  const score =
    recommendation.finalScore ?? profile.recommendationScore ?? null;
  const confidence =
    recommendation.confidence ??
    profile.recommendationConfidence ??
    null;
  const explanation =
    recommendation.explanation ?? profile.recommendationReason ?? "";
  const processingTime =
    recommendation.processingTimeMs ?? profile.processingTimeMs ?? null;

  return (
    <article className="min-w-0 rounded-xl border border-border bg-background p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-semibold text-foreground">
              {profile.fileName ||
                profile.filename ||
                `Profile #${profile.id}`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Uploaded {formatDate(profile.uploadedAt ?? profile.submittedAt)}
            </p>
          </div>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getDecisionStyle(decision)}`}
        >
          {getDecisionLabel(decision)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Match score" value={formatPercent(score)} />
        <Metric label="Confidence" value={formatPercent(confidence)} />
        <Metric
          label="Processing time"
          value={
            processingTime == null
              ? "—"
              : `${(Number(processingTime) / 1000).toFixed(2)} sec`
          }
          icon={Clock3}
        />
      </div>

      <div className="mt-4 rounded-lg bg-muted/40 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          AI Explanation
        </h4>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
          {explanation ||
            "Evaluation has not completed, or no explanation is available yet."}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={
            actionLoading ||
            profile.status === "SHORTLISTED" ||
            profile.status === "REJECTED"
          }
          onClick={() => onDecision(profile, "SHORTLIST")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {profile.status === "SHORTLISTED"
            ? "Shortlisted"
            : actionLoading
              ? "Updating..."
              : "Shortlist"}
        </button>

        <button
          type="button"
          disabled={
            actionLoading ||
            profile.status === "REJECTED" ||
            profile.status === "SHORTLISTED"
          }
          onClick={() => onDecision(profile, "REJECT")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          <X className="h-4 w-4" />
          {profile.status === "REJECTED"
            ? "Rejected"
            : actionLoading
              ? "Updating..."
              : "Reject"}
        </button>
      </div>
    </article>
  );
}

export default function OpeningDetailsLayout({ openId }) {
  const router = useRouter();

  const [opening, setOpening] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOpeningDetails = useCallback(
    async (signal) => {
      if (!openId) {
        setError("Opening ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/openings/${encodeURIComponent(openId)}?page=${page}&pageSize=${pageSize}`,
          {
            credentials: "include",
            signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load opening details."
          );
        }

        const payload = result.data ?? result;
        setOpening(payload.opening ?? null);

        const normalizedProfiles = (payload.profiles ?? []).map((profile) => {
          const rawRecommendation = Array.isArray(profile.recommendations)
            ? profile.recommendations[0]
            : profile.recommendations;

          const decision =
            rawRecommendation?.decision ??
            profile.decision ??
            (profile.recommended === true
              ? "RECOMMENDED"
              : profile.recommended === false
                ? "NOT_RECOMMENDED"
                : null);

          return {
            ...profile,
            fileName:
              profile.fileName ??
              profile.filename ??
              profile.s3Key?.split("/").pop() ??
              `Profile #${profile.id}`,
            uploadedAt: profile.uploadedAt ?? profile.submittedAt,
            recommendation: {
              decision,
              finalScore:
                rawRecommendation?.finalScore ??
                profile.recommendationScore ??
                null,
              confidence:
                rawRecommendation?.confidence ??
                profile.recommendationConfidence ??
                null,
              explanation:
                rawRecommendation?.explanation ??
                profile.recommendationReason ??
                "",
              processingTimeMs:
                rawRecommendation?.processingTimeMs ??
                profile.processingTimeMs ??
                null,
            },
          };
        });

        setProfiles(normalizedProfiles);

        const total =
          payload.pagination?.total ??
          payload.totalProfiles ??
          normalizedProfiles.length;

        setPagination({
          total,
          totalPages:
            payload.pagination?.totalPages ??
            Math.ceil(total / pageSize),
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load opening details.");
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [openId, page, pageSize]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchOpeningDetails(controller.signal);
    return () => controller.abort();
  }, [fetchOpeningDetails, retry]);

  async function handleDecision(profile, action) {
    const actionText = action === "SHORTLIST" ? "shortlist" : "reject";

    if (!window.confirm(`Are you sure you want to ${actionText} this candidate?`)) {
      return;
    }

    setActionLoading(profile.id);
    setError("");

    try {
      const endpoint =
        action === "SHORTLIST"
          ? `${API_BASE}/profiles/${encodeURIComponent(profile.id)}/shortlist`
          : `${API_BASE}/profiles/${encodeURIComponent(profile.id)}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `Unable to ${actionText} candidate.`
        );
      }

      const nextStatus =
        action === "SHORTLIST" ? "SHORTLISTED" : "REJECTED";

      setProfiles((previous) =>
        previous.map((item) =>
          item.id === profile.id
            ? {
                ...item,
                status: result.data?.status ?? nextStatus,
              }
            : item
        )
      );
    } catch (err) {
      setError(err.message || `Unable to ${actionText} candidate.`);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const query = search.trim().toLowerCase();
    const filename = String(profile.fileName ?? "").toLowerCase();
    const decision =
      profile.recommendation?.decision ?? profile.decision ?? null;

    return (
      filename.includes(query) &&
      (statusFilter === "ALL" || decision === statusFilter)
    );
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.push("/hiring-manager/openings")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to resumes
        </button>

        {opening && (
          <section className="mb-8 rounded-xl border border-border bg-background p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="break-words text-2xl font-bold sm:text-3xl">
                  {opening.title || "Opening details"}
                </h1>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {opening.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {opening.location || "Location not specified"}
              </span>
              <span className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
                {opening.contractType || "Contract not specified"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Posted {formatDate(opening.postedDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" />
                {pagination.total} resumes
              </span>
            </div>
          </section>
        )}

        {!opening && !loading && !error && (
          <p className="mb-6 rounded-lg border border-border p-4">
            Opening details were not found.
          </p>
        )}

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Submitted Resumes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review AI-assisted candidate recommendations for this opening.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search file names"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="ALL">All recommendations</option>
                <option value="RECOMMENDED">Recommended</option>
                <option value="BORDERLINE">Borderline</option>
                <option value="NOT_RECOMMENDED">Not recommended</option>
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-current px-3 py-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProfileSkeleton key={index} />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No resumes found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try changing your search or recommendation filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filteredProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onDecision={handleDecision}
                  actionLoading={actionLoading === profile.id}
                />
              ))}
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Page {page} of {pagination.totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border border-border px-4 py-2 text-foreground disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border border-border px-4 py-2 text-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
