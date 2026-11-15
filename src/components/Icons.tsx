import React from "react";

interface IconProps {
  className?: string;
}

export function BrandMark({ className = "w-8 h-8" }: IconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="6"
        width="25"
        height="20"
        rx="4"
        fill="#141413"
      />
      <rect x="27" y="12" width="3" height="8" rx="1.5" fill="#EA580C" />
      <rect x="6" y="10" width="5" height="12" rx="1.5" fill="#F5F4F0" />
      <rect x="13" y="10" width="5" height="12" rx="1.5" fill="#F5F4F0" />
      <rect x="20" y="10" width="3" height="12" rx="1.5" fill="#EA580C" />
    </svg>
  );
}

export function PassportIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

export function RepairIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-2.1 2.3-2.3Z" />
    </svg>
  );
}

export function JourneyIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H13a3 3 0 0 0 3-3V9a3 3 0 0 1 2-2.8" />
      <path d="M6 15.5V9a3 3 0 0 1 3-3h6.5" />
    </svg>
  );
}

export function AuthenticityIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3 5 6v5.5c0 4.5 3 8.3 7 9.5 4-1.2 7-5 7-9.5V6l-7-3Z" />
      <path d="M9.5 12h5" />
      <path d="M12 9.5v5" />
    </svg>
  );
}

export function GlobeIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M12 3a13.5 13.5 0 0 0 0 18" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18" />
    </svg>
  );
}

export function LockIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function AlertIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.3 3.9 2.5 17.5A1.8 1.8 0 0 0 4.1 20h15.8a1.8 1.8 0 0 0 1.6-2.5L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function InfoIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function WheeledBinIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Crossed-out wheeled bin symbol"
      className={className}
    >
      <path d="M12 12h16l-1.5 17h-13L12 12Z" />
      <path d="M10 12h20" />
      <path d="M16 12V9.5h8V12" />
      <circle cx="28" cy="29" r="2.2" />
      <path d="M8 33 32 9" strokeWidth={1.9} />
      <path d="M8 9 32 33" strokeWidth={1.9} />
      <path d="M12 36h16" strokeWidth={2} />
    </svg>
  );
}
