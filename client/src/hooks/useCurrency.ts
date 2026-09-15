import { useEffect, useState } from "react";

export type Currency = "تومان" | "ریال";
export const readCurrency = (): Currency => { try { return JSON.parse(localStorage.getItem("sepid-settings") || "{}").currency === "ریال" ? "ریال" : "تومان"; } catch { return "تومان"; } };
export const currencyLabel = () => readCurrency();
export const convertCurrencyValue = (value: number, currency = readCurrency()) => currency === "ریال" ? value * 10 : value;
export const formatCurrency = (value: number, currency = readCurrency()) => `${convertCurrencyValue(Number(value) || 0, currency).toLocaleString("fa-IR")} ${currency}`;
export const formatNumberInput = (value: number | string) => { const digits = String(value ?? "").replace(/[^0-9]/g, ""); return digits ? Number(digits).toLocaleString("fa-IR") : ""; };
export const parseNumberInput = (value: string) => Number(value.replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[^0-9]/g, "")) || 0;
export function useCurrency() { const [currency, setCurrency] = useState<Currency>(() => readCurrency()); useEffect(() => { const sync = () => setCurrency(readCurrency()); window.addEventListener("sepid-settings-updated", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("sepid-settings-updated", sync); window.removeEventListener("storage", sync); }; }, []); return { currency, currencyLabel: currency, formatCurrency: (value: number) => formatCurrency(value, currency), formatNumberInput, parseNumberInput }; }
