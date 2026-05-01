import { badges } from "./badges";

export const chapters = badges.map((badge) => ({
  number: badge.chapter,
  title: badge.name,
  from: badge.from,
  to: badge.to,
}));
