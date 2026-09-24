import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  isChunkLoadError: boolean;
}

const CHUNK_RELOAD_STORAGE_KEY = "rts_chunk_reload_attempted";

/**
 * Checks whether an error is caused by a dynamic import / chunk load failure.
 */
const isChunkError = (error?: Error): boolean => {
  if (!error) return false;
  const message = error.message || "";
  const name = error.name || "";
  return (
    name === "ChunkLoadError" ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /loading chunk [\w-]+ failed/i.test(message)
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    isChunkLoadError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      isChunkLoadError: isChunkError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Component or chunk load error:", error, errorInfo);

    // Auto-reload once on dynamic chunk load failure if not already attempted in this session
    if (isChunkError(error)) {
      const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
      if (!alreadyAttempted) {
        sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "true");
        window.location.reload();
      }
    }
  }

  private handleManualReload = () => {
    // Clear auto-reload guard so future chunk failures can retry once
    sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunk = this.state.isChunkLoadError;

      return (
        <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[28px]">
              {isChunk ? "cloud_off" : "error"}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">
            {isChunk ? "New version available" : "Unable to load page"}
          </h2>
          <p className="text-sm text-[#5F6368] max-w-sm mb-4">
            {isChunk
              ? "A fresh version of this page is available. Please reload to load the latest updates."
              : "A problem occurred while rendering this section. Please reload to try again."}
          </p>
          <button
            type="button"
            onClick={this.handleManualReload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3864] hover:bg-[#162a4d] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
