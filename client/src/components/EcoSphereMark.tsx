import React, { useState } from "react";

/**
 * Field Operations Ledger style: a compact orbital field-marker presentation
 * using the generated transparent EcoSphere symbol and precise brand typography.
 */
type EcoSphereMarkProps = {
  inverse?: boolean;
  compact?: boolean;
};

export default function EcoSphereMark({ inverse = false, compact = false }: EcoSphereMarkProps) {
  const [markerUnavailable, setMarkerUnavailable] = useState(false);
  return (
    <div className={`brand-lockup ${inverse ? "brand-lockup--inverse" : ""} ${compact ? "brand-lockup--compact" : ""}`}>
      {markerUnavailable ? <span className="brand-mark brand-mark--fallback" aria-hidden="true">ES</span> : <img
        className="brand-mark"
        src="/manus-storage/ecosphere-field-marker_4829d44d.png"
        alt="EcoSphere AI field marker"
        onError={() => setMarkerUnavailable(true)}
      />}
      {!compact && (
        <span className="brand-name" aria-label="EcoSphere AI">
          EcoSphere <b>AI</b>
        </span>
      )}
    </div>
  );
}
