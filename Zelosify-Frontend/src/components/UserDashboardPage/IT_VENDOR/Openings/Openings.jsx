
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5000/api/v1/vendor/openings";

export default function OpeningsLayout() {
  const router = useRouter();

  const [openings, setOpenings] = useState([]);
  const [selectedOpenings, setSelectedOpenings] = useState([]);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [retry, setRetry] = useState(0);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 10,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch openings from the backend
  useEffect(() => {
    const controller = new AbortController();

    async function fetchOpenings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}?page=${page}&pageSize=${pageSize}`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              (response.status === 401
                ? "Please log in again."
                : response.status === 403
                  ? "You are not authorized to view these openings."
                  : "Failed to fetch openings.")
          );
        }

        setOpenings(result.data ?? result.openings ?? []);

        setPagination({
          total: result.pagination?.total ?? 0,
          totalPages: result.pagination?.totalPages ?? 0,
          page: result.pagination?.page ?? page,
          pageSize: result.pagination?.pageSize ?? pageSize,
        });

        setSelectedOpenings([]);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to fetch openings.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOpenings();

    return () => controller.abort();
  }, [page, pageSize, retry]);

  // Search and status filtering on the currently loaded page
  const filteredOpenings = openings.filter((opening) => {
    const term = search.trim().toLowerCase();

    const matchesSearch = [
      opening.title,
      opening.location,
      opening.contractType,
      opening.hiringManagerName,
      opening.status,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(term)
    );

    const matchesStatus =
      statusFilter === "ALL" || opening.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectOpening = (id) => {
    setSelectedOpenings((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const allSelected =
    filteredOpenings.length > 0 &&
    filteredOpenings.every((opening) =>
      selectedOpenings.includes(opening.id)
    );

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedOpenings((previous) => [
        ...new Set([
          ...previous,
          ...filteredOpenings.map((opening) => opening.id),
        ]),
      ]);
    } else {
      const visibleIds = filteredOpenings.map((opening) => opening.id);

      setSelectedOpenings((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    }
  };

  const handleOpeningClick = (opening) => {
  if (!opening?.id) {
    console.error("Opening ID is missing:", opening);
    setError("Cannot open this opening because its ID is missing.");
    return;
  }

  router.push(
    `/vendor/openings/${encodeURIComponent(opening.id)}`
  );
};

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = pagination.totalPages;
  const firstRecord =
    pagination.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, pagination.total);

  return (
    <div className="flex min-h-screen bg-background px-2">
      <div className="min-w-0 flex-1 overflow-y-auto transition-all duration-300">
        <div className="p-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Openings
              </h1>

              <p className="mt-1 text-sm text-secondary">
                Browse openings available in your organization.
              </p>
            </div>

            {!isSidebarVisible && (
              <button
                type="button"
                aria-label="Show opening summary"
                onClick={() => setIsSidebarVisible(true)}
                className="rounded-md p-2 text-foreground hover:bg-tableHeader"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search and filters */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((previous) => !previous)}
                className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm text-background"
              >
                Filter
                <Filter className="h-4 w-4" />
              </button>

              {filterOpen && (
                <div className="absolute left-0 top-full z-10 mt-2 w-48 rounded-md border border-border bg-background p-3 shadow-lg">
                  <label className="mb-2 block text-xs text-secondary">
                    Opening status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-border bg-background p-2 text-sm text-foreground"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ON_HOLD">On hold</option>
                  </select>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />

              <input
                type="search"
                placeholder="Search openings"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring sm:w-64"
              />
            </div>
          </div>

          {/* Openings table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-tableHeader">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label="Select all visible openings"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="rounded border border-border"
                    />
                  </th>

                  {[
                    "Title",
                    "Location",
                    "Contract Type",
                    "Posted Date",
                    "Hiring Manager Name",
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
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-secondary"
                    >
                      Loading openings...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-red-500"
                    >
                      <p>{error}</p>

                      <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                        className="mt-3 rounded-md border border-border px-4 py-2 text-foreground"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filteredOpenings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-secondary"
                    >
                      No openings found.
                    </td>
                  </tr>
                ) : (
                  filteredOpenings.map((opening) => (
                    <tr
                      key={opening.id}
                      className="cursor-pointer border-b border-border hover:bg-tableHeader"
                      onClick={() => handleOpeningClick(opening)}
                    >
                      <td
                        className="px-4 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${opening.title}`}
                          checked={selectedOpenings.includes(opening.id)}
                          onChange={() => handleSelectOpening(opening.id)}
                          className="rounded border border-border"
                        />
                      </td>

                      <td className="px-4 py-4 text-sm font-normal text-foreground">
                        {opening.title || "Untitled opening"}
                      </td>

                      <td className="px-4 py-4 text-sm font-normal text-foreground">
                        {opening.location || "Not specified"}
                      </td>

                      <td className="px-4 py-4 text-sm font-normal text-foreground">
                        {opening.contractType || "Not specified"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-normal text-foreground">
                        {formatDate(opening.postedDate)}
                      </td>

                      <td className="px-4 py-4 text-sm font-normal text-foreground">
                        {opening.hiringManagerName || "Unknown"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !error && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-secondary">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  {firstRecord}–{lastRecord} of {pagination.total} openings
                </span>

                <label className="flex items-center gap-2">
                  Rows per page
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    className="rounded-md border border-border bg-background p-1.5 text-foreground"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((previous) => previous - 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={totalPages === 0 || page >= totalPages}
                  onClick={() => setPage((previous) => previous + 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Opening summary sidebar */}
      {isSidebarVisible && (
        <aside className="ml-3 hidden w-64 shrink-0 border-l border-border p-4 sm:block">
          <button
            type="button"
            onClick={() => setIsSidebarVisible(false)}
            className="text-sm text-foreground underline"
          >
            Close
          </button>

          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Opening Summary
          </h2>

          <p className="mt-2 text-sm text-secondary">
            {pagination.total} openings available
          </p>

          <p className="mt-2 text-sm text-secondary">
            {selectedOpenings.length} selected
          </p>
        </aside>
      )}
    </div>
  );
}
