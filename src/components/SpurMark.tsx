/**
 * The Spurs' spur mark, drawn from the geometry of the team's official
 * primary logo (cdn.nba.com). The silhouette takes `currentColor` and the
 * interior cuts take `--mark-cut`, so it sits correctly on any surface.
 */
export function SpurMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ "--mark-cut": "var(--bg)" } as React.CSSProperties}
    >
      {title ? <title>{title}</title> : null}
      <polygon
        fill="currentColor"
        points="289.4,53 270.4,86.8 267.1,113.8 233.1,174.2 188.6,174.2 221.8,115.6 221.8,53 187.4,53 169.2,86.5
          166,113.8 117.6,200 125.8,220.3 155.9,220.3 142.2,255.1 116.4,227.4 119.5,268.1 75,269.9 110.4,294.9 85.2,332.5
          125.9,319.2 142.6,359.5 155.4,315.6 200.9,327.3 171.5,293.3 207.6,263.5 170.3,265.9 210.7,220.3 263.7,220.3
          322.4,116.3 322.4,53"
      />
      <g fill="var(--mark-cut)">
        <polygon points="282.3,83.1 298.4,83.1 309.6,62.1 294.1,62.1" />
        <polygon points="181.2,83.2 198.5,83.1 209.6,62.1 192.8,62.1" />
        <polygon points="177.1,109.6 192.7,109.6 194.1,91.6 179.1,91.6" />
        <polygon points="277.8,109.6 293.5,109.6 294.9,91.6 279.8,91.6" />
        <path
          d="M274.5,120.4l-35.2,62h-84.5l35.2-62h-16.6l-42.5,75h47.2l-35.7,79.9l-14.8-16.5l0.8,19.4l-23.9,1.4l19.2,13.5
            L110,313.4l22.1-7.2l9.1,21.9l6.9-23.8l24.6,6.3l-15.8-18.4l19.5-16.1l-30.2,1.4l55.5-82H249l41.8-75L274.5,120.4L274.5,120.4z
            M136.3,297.8c-4,0-7.2-3.2-7.2-7.1c0-4,3.2-7.1,7.2-7.1s7.1,3.2,7.1,7.1C143.4,294.6,140.2,297.8,136.3,297.8"
        />
      </g>
    </svg>
  );
}
