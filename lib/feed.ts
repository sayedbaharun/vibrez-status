import updates from "@/data/updates.json";
import { parseUpdates, type BotUpdate } from "./updates";

export function getUpdates(): BotUpdate[] {
  return parseUpdates(updates);
}
