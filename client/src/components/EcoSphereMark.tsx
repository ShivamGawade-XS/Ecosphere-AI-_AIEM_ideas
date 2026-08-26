import React from "react";

/**
 * Field Operations Ledger style: a compact orbital field-marker presentation
 * using a self-contained vector field marker and precise brand typography.
 */
type EcoSphereMarkProps = {
  inverse?: boolean;
  compact?: boolean;
};

export default function EcoSphereMark({ inverse = false, compact = false }: EcoSphereMarkProps) {
  return (
    <div className={`brand-lockup ${inverse ? "brand-lockup--inverse" : ""} ${compact ? "brand-lockup--compact" : ""}`}>
      <svg className="brand-mark" viewBox="0 0 36 36" role="img" aria-label="EcoSphere AI field marker">
        <circle cx="18" cy="18" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".78" />
        <circle cx="18" cy="18" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".65" />
        <path d="M18 5.5v25M5.5 18h25" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
        <path d="M22.8 11.2c-5.9.2-9.5 3.1-10.8 9.5 5.7-.2 9.5-3 10.8-9.5Z" fill="currentColor" />
        <circle cx="18" cy="18" r="2.3" fill="var(--chartreuse, #b5cf4d)" stroke="currentColor" strokeWidth="1" />
      </svg>
      {!compact && (
        <span className="brand-name" aria-label="EcoSphere AI">
          EcoSphere <b>AI</b>
        </span>
      )}
    </div>
  );
}
