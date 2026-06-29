import React from "react";

export function Gauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = "text-green-500";
  if (value >= 30) color = "text-yellow-500";
  if (value >= 60) color = "text-orange-500";
  if (value >= 80) color = "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-mono font-bold">{value}</span>
      </div>
    </div>
  );
}

export function ThreatBadge({ severity, className = "" }: { severity: string, className?: string }) {
  const colors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const style = colors[severity as keyof typeof colors] || colors.low;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} uppercase tracking-wider ${className}`}>
      {severity}
    </span>
  );
}
