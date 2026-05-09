import type { UiLanguage } from "./types.js";

export const DEFAULT_UI_LANGUAGE: UiLanguage = "en-US";

export function normalizeUiLanguage(value?: string): UiLanguage {
  return value === "zh-CN" ? "zh-CN" : DEFAULT_UI_LANGUAGE;
}

export function formatUiWhen(value: string | undefined | null, language: UiLanguage): string {
  if (!value) {
    return language === "zh-CN" ? "无" : "n/a";
  }

  return new Date(value).toLocaleString(language, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUiNumber(value: number | undefined, language: UiLanguage): string {
  return new Intl.NumberFormat(language).format(value ?? 0);
}

export function sessionStatusLabel(status: string | undefined, language: UiLanguage): string {
  const key = status ?? "unknown";
  const zhMap: Record<string, string> = {
    discovered: "已发现",
    active: "活跃中",
    applied: "已应用",
    idle: "空闲",
    archived_hint: "疑似归档",
    missing: "缺失",
    unknown: "未知",
  };
  const enMap: Record<string, string> = {
    discovered: "Discovered",
    active: "Active",
    applied: "Applied",
    idle: "Idle",
    archived_hint: "Archive Hint",
    missing: "Missing",
    unknown: "Unknown",
  };

  return (language === "zh-CN" ? zhMap : enMap)[key] ?? key;
}

export function booleanLabel(
  value: boolean,
  language: UiLanguage,
  labels?: { yes: string; no: string },
): string {
  if (labels) {
    return value ? labels.yes : labels.no;
  }
  return language === "zh-CN" ? (value ? "是" : "否") : value ? "Yes" : "No";
}
