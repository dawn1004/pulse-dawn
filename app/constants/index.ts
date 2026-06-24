export const AVATARS = [
  { id: "happy", label: "Happy", src: "/img/happy.png" },
  { id: "excited", label: "Excited", src: "/img/excited.png" },
  { id: "calm", label: "Calm", src: "/img/calm.png" },
  { id: "focused", label: "Focused", src: "/img/focused.png" },
  { id: "thinking", label: "Thinking", src: "/img/thinking.png" },
  { id: "neutral", label: "Neutral", src: "/img/neutral.png" },
  { id: "alert", label: "Alert", src: "/img/alert.png" },
] as const;

export const TAGS = [
  "beach",
  "mountain",
  "food",
  "music",
  "travel",
  "gaming",
  "books",
  "fitness",
  "art",
  "photography",
  "coffee",
  "nightlife",
  "nature",
  "tech",
  "movies",
  "sports",
  "cooking",
  "pets",
  "fashion",
  "meditation",
  "dance",
  "hiking",
  "surfing",
  "yoga",
  "coding",
] as const;

export const REPORT_REASONS = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment" },
  { id: "inappropriate", label: "Inappropriate Content" },
  { id: "other", label: "Other" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];
