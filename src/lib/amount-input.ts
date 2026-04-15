export function normalizeAmountInput(value: string) {
  const sanitizedValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const decimalSeparatorIndex = sanitizedValue.indexOf(".");

  if (decimalSeparatorIndex === -1) {
    return sanitizedValue;
  }

  const integerPart = sanitizedValue.slice(0, decimalSeparatorIndex);
  const decimalPart = sanitizedValue.slice(decimalSeparatorIndex + 1).replace(/\./g, "").slice(0, 2);

  return `${integerPart}.${decimalPart}`;
}

export function formatAmountInput(value: string) {
  if (!value) {
    return "";
  }

  const [integerPart, decimalPart] = value.split(".");
  const formattedIntegerPart = integerPart
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(integerPart))
    : "0";

  if (decimalPart === undefined) {
    return formattedIntegerPart;
  }

  return `${formattedIntegerPart}.${decimalPart}`;
}

export function parseAmountInput(value: string) {
  if (!value) {
    return 0;
  }

  const parsedValue = Number(value.replace(/,/g, ""));

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
