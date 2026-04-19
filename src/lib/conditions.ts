type ProductCondition = {
  value: string;
  label: string;
  tooltip: string;
  shortLabel: string;
  aliases?: string[];
};

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  {
    value: "Brand New",
    shortLabel: "Brand New",
    label: "Brand New (Never used • Sealed or open-box but untouched • Comes with everything)",
    tooltip: "Never used. Sealed or open-box but untouched. Comes with everything.",
    aliases: ["🟢 New / Brand New", "New", "NEW"],
  },
  {
    value: "New With Tags",
    shortLabel: "New With Tags",
    label: "New With Tags (Unused • Original tags still attached • Clean and untouched)",
    tooltip: "Unused item with original tags still attached. Clean, untouched, and ready to wear or gift.",
    aliases: [],
  },
  {
    value: "Mint",
    shortLabel: "Mint",
    label: "Mint (Looks basically brand new • No visible scratches or wear • Fully functional)",
    tooltip: "Looks basically brand new. No visible scratches or wear. Fully functional.",
    aliases: ["🟢 Mint / Like New", "Like New", "LIKE NEW"],
  },
  {
    value: "Open Box",
    shortLabel: "Open Box",
    label: "Open Box (Opened for inspection • Little to no use • Includes essential contents)",
    tooltip: "Opened for inspection or display, with little to no use. Includes the essential contents and works as expected.",
    aliases: [],
  },
  {
    value: "Excellent",
    shortLabel: "Excellent",
    label: "Excellent (Very light signs of use • Tiny marks only if you look closely • Works perfectly)",
    tooltip: "Very light signs of use. Maybe tiny marks you have to look closely to see. Works perfectly.",
    aliases: ["🟢 Excellent", "EXCELLENT"],
  },
  {
    value: "Gently Used",
    shortLabel: "Gently Used",
    label: "Gently Used (Noticeable but minor wear • No major damage • Fully functional)",
    tooltip: "Noticeable but minor wear, like small scratches or slight handling marks. No major damage. Fully functional.",
    aliases: ["🟡 Very Good", "Very Good"],
  },
  {
    value: "Used",
    shortLabel: "Used",
    label: "Used (Clear signs of use • Scratches, scuffs, cosmetic wear • Still works fine)",
    tooltip: "Clear signs of use with scratches, scuffs, or cosmetic wear. Still works fine.",
    aliases: ["🟡 Good", "Good", "GOOD"],
  },
  {
    value: "Fair",
    shortLabel: "Fair",
    label: "Fair (Heavy wear and tear • Possible minor issues • Still usable)",
    tooltip: "Heavy wear and tear. Possible minor issues like loose buttons or worn parts. Still usable.",
    aliases: ["🟠 Fair", "FAIR"],
  },
];

function findCondition(conditionValue: string | undefined): ProductCondition | null {
  if (!conditionValue) return null;

  const normalized = conditionValue.trim();
  return (
    PRODUCT_CONDITIONS.find((condition) =>
      condition.value === normalized ||
      condition.shortLabel === normalized ||
      condition.aliases?.includes(normalized)
    ) || null
  );
}

export function getConditionTooltip(conditionValue: string | undefined): string | null {
  return findCondition(conditionValue)?.tooltip || null;
}

export function getConditionDisplayLabel(conditionValue: string | undefined): string | null {
  if (!conditionValue) return null;
  return findCondition(conditionValue)?.shortLabel || conditionValue;
}

export function normalizeConditionValue(conditionValue: string | undefined): string {
  if (!conditionValue) return '';
  return findCondition(conditionValue)?.value || conditionValue;
}
