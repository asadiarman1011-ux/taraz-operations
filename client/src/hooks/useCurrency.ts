import { useEffect, useState } from "react";

export type Currency = "تومان" | "ریال";
export const readCurrency = (): Currency => { try { return JSON.parse(localStorage.getItem("sepid-settings") || "{}").currency === "تومان" ? "تومان" : "ریال"; } catch { return "ریال"; } };
export const currencyLabel = () => readCurrency();
export const convertCurrencyValue = (value: number, currency = readCurrency()) => currency === "ریال" ? value * 10 : value;
export const formatCurrency = (value: number, currency = readCurrency()) => `${convertCurrencyValue(Number(value) || 0, currency).toLocaleString("fa-IR")} ${currency}`;
export const formatNumberInput = (value: number | string) => { const digits = String(value ?? "").replace(/[^0-9]/g, ""); return digits ? Number(digits).toLocaleString("fa-IR") : ""; };
export const parseNumberInput = (value: string) => Number(value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[^0-9]/g, "")) || 0;
export function useCurrency() { const [currency, setCurrency] = useState<Currency>(() => readCurrency()); useEffect(() => { const sync = () => setCurrency(readCurrency()); window.addEventListener("sepid-settings-updated", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("sepid-settings-updated", sync); window.removeEventListener("storage", sync); }; }, []); return { currency, currencyLabel: currency, formatCurrency: (value: number) => formatCurrency(value, currency), formatNumberInput, parseNumberInput }; }

const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
const threeDigitWords = (value: number) => { const parts: string[] = []; const hundred = Math.floor(value / 100); const rest = value % 100; if (hundred) parts.push(hundreds[hundred]); if (rest >= 10 && rest < 20) parts.push(teens[rest - 10]); else { const ten = Math.floor(rest / 10); const one = rest % 10; if (ten) parts.push(tens[ten]); if (one) parts.push(ones[one]); } return parts.join(" و "); };
export const numberToPersianWords = (value: number) => { const integer = Math.floor(Math.abs(Number(value) || 0)); if (!integer) return "صفر"; const parts: string[] = []; let remaining = integer; let scaleIndex = 0; while (remaining > 0) { const chunk = remaining % 1000; if (chunk) parts.unshift(`${threeDigitWords(chunk)}${scales[scaleIndex] ? ` ${scales[scaleIndex]}` : ""}`); remaining = Math.floor(remaining / 1000); scaleIndex += 1; } return parts.join(" و "); };
