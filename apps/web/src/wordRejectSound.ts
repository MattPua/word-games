import { play } from "cuelume";
import type { SubmitResult } from "@couch-potato/game-engine";

/** Reject reasons that get feedback (flash + SFX). Empty/cancel paths stay silent. */
export type RejectReason = Extract<
  SubmitResult,
  { ok: false }
>["reason"];

export function isRejectedWordSubmit(
  reason: RejectReason,
): reason is "short" | "invalid" | "duplicate" {
  return reason !== "bad_path" && reason !== "ended";
}

/** Soft cuelume refusal on invalid word submit — respects global mute via `setEnabled`. */
export function playRejectedWordSound(): void {
  play("error");
}
