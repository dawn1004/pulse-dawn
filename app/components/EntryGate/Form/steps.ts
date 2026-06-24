import { Sparkles, Tags, User } from "lucide-react";

export const MAX_TAGS = 10;

export const STEPS = [
  {
    label: "About you",
    short: "Profile",
    description: "Tell strangers a little about yourself.",
    icon: User,
  },
  {
    label: "How you feel",
    short: "Mood",
    description: "Pick the avatar that matches your vibe today.",
    icon: Sparkles,
  },
  {
    label: "Your tags",
    short: "Interests",
    description: "Share what you're into so people know what to talk about.",
    icon: Tags,
  },
] as const;
