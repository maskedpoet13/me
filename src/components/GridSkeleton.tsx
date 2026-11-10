const heights = ["h-40", "h-56", "h-32", "h-48", "h-64", "h-36", "h-52", "h-44"];

/** Placeholder masonry cards shown while the grid loads. */
export default function GridSkeleton() {
  return (
    <div className="columns-2 gap-4 p-4 md:columns-3 md:p-8 xl:columns-4" role="status" aria-label="Loading your items">
      {heights.map((h, i) => (
        <div key={i} className={`skeleton mb-4 break-inside-avoid rounded-card ${h}`} />
      ))}
    </div>
  );
}
