import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  fullScreen = true,
}) => {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      {message && (
        <span className="font-body-sm text-on-surface-variant font-medium">
          {message}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-surface">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-8 flex items-center justify-center">
      {content}
    </div>
  );
};

export default LoadingSpinner;
