import React from "react";
import { useCan, useCanAtScope } from "@/features/auth";

export interface CanProps {
  permission: string;
  scope?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative RBAC permission gate wrapper.
 * Renders `children` only if the logged-in user possesses the specified permission (and optional scope).
 * Otherwise renders `fallback` (defaults to null).
 */
export const Can: React.FC<CanProps> = ({
  permission,
  scope,
  children,
  fallback = null,
}) => {
  const hasScope = useCanAtScope(permission, scope || "");
  const hasAny = useCan(permission);

  const isAllowed = scope ? hasScope : hasAny;

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
