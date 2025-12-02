/**
 * Formats organization type by replacing underscores and hyphens with spaces
 * @param type - Organization type string (e.g., "TRAINING_CENTER")
 * @returns Formatted string (e.g., "Training Center")
 */
export function formatOrganizationType(type: string): string {
  return type.replace(/_/g, " ").replace(/-/g, " ");
}

