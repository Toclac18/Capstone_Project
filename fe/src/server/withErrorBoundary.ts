// src/server/withErrorBoundary.ts
import { jsonResponse } from "@/server/response";

export type ErrorDialogPayload = {
  title: string;
  description: string;
  variant: "error";
  primaryActionLabel: string;
};

export type WithErrorBoundaryOptions = {
  context?: string;
  statusCode?: number;
};

/**
 * Wraps a route handler and converts unexpected exceptions into a
 * consistent JSON shape that the frontend can render via AlertDialog.
 */
export async function withErrorBoundary(
  handler: () => Promise<Response>,
  options?: WithErrorBoundaryOptions,
): Promise<Response> {
  try {
    return await handler();
  } catch (err: any) {
    const context = options?.context ?? "API";
    console.error(`[withErrorBoundary] Unhandled error in ${context}:`, err);

    const message =
      err?.message ||
      "An unexpected error occurred while processing your request.";

    const dialog: ErrorDialogPayload = {
      variant: "error",
      title: "Unexpected error",
      description:
        "We ran into an unexpected problem while processing your request. Please try again. If the issue continues, contact the system administrator.",
      primaryActionLabel: "OK",
    };

    return jsonResponse(
      {
        error: message,
        dialog,
      },
      { status: options?.statusCode ?? 500, mode: "real" },
    );
  }
}
