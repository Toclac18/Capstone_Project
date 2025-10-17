export function compactFormat(value: number) {
  const formatter = new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
}
// Ví dụ:
// compactFormat(1200) => "1.2K"
// compactFormat(1500000) => "1.5M"

export function standardFormat(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
// Ví dụ:
// standardFormat(1200) => "1,200.00"
// standardFormat(1500000) => "1,500,000.00"