export const PRODUCT_CONDITIONS = [
  {
    value: "🟢 New / Brand New",
    label: "🟢 New / Brand New (Never used • Sealed or open-box but untouched • Comes with everything)",
    tooltip: "Never used • Sealed or open-box but untouched • Comes with everything",
    shortLabel: "🟢 New / Brand New"
  },
  {
    value: "🟢 Mint / Like New",
    label: "🟢 Mint / Like New (Looks basically brand new • No visible scratches or wear • Fully functional)",
    tooltip: "Looks basically brand new • No visible scratches or wear • Fully functional",
    shortLabel: "🟢 Mint / Like New"
  },
  {
    value: "🟢 Excellent",
    label: "🟢 Excellent (Very light signs of use • Maybe tiny marks you have to look closely to see • Works perfectly)",
    tooltip: "Very light signs of use • Maybe tiny marks you have to look closely to see • Works perfectly",
    shortLabel: "🟢 Excellent"
  },
  {
    value: "🟡 Very Good",
    label: "🟡 Very Good (Noticeable but minor wear • No major damage • Fully functional)",
    tooltip: "Noticeable but minor wear (small scratches, slight signs of handling) • No major damage • Fully functional",
    shortLabel: "🟡 Very Good"
  },
  {
    value: "🟡 Good",
    label: "🟡 Good (Clear signs of use • Scratches, scuffs, cosmetic wear • Still works fine)",
    tooltip: "Clear signs of use • Scratches, scuffs, cosmetic wear • Still works fine",
    shortLabel: "🟡 Good"
  },
  {
    value: "🟠 Fair",
    label: "🟠 Fair (Heavy wear and tear • Possible minor issues • Still usable)",
    tooltip: "Heavy wear and tear • Possible minor issues (loose buttons, worn parts) • Still usable",
    shortLabel: "🟠 Fair"
  },
  {
    value: "🔴 Poor / For Parts",
    label: "🔴 Poor / For Parts (Major damage or not working properly • Sold for repair or parts)",
    tooltip: "Major damage or not working properly • Sold for repair or parts",
    shortLabel: "🔴 Poor / For Parts"
  }
];

export function getConditionTooltip(conditionValue: string | undefined): string | null {
  if (!conditionValue) return null;
  const match = PRODUCT_CONDITIONS.find(c => c.value === conditionValue || c.shortLabel === conditionValue);
  return match ? match.tooltip : null;
}
