/**
 * CSV Export Utility
 * Converts data to CSV format and triggers browser download
 */

export function escapeCsvValue(
  value: string | number | null | undefined,
): string {
  const str = String(value ?? "");
  // Escape quotes and wrap in quotes if contains special characters
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
) {
  try {
    // Build CSV header
    const csvHeaders = headers.map(escapeCsvValue).join(",");

    // Build CSV data rows
    const csvData = rows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    // Combine
    const csv = `${csvHeaders}\n${csvData}`;

    // Create blob
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to generate CSV: ${(error as Error).message}`);
  }
}
