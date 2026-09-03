export type MomoChannel = "mtn-gh" | "vodafone-gh" | "tigo-gh";

/** Hubtel receive-money expects local format: 0XXXXXXXXX */
export function toLocalMsisdn(phone233: string): string {
  if (phone233.startsWith("233")) return `0${phone233.slice(3)}`;
  if (phone233.startsWith("0")) return phone233;
  return `0${phone233}`;
}

export function resolveMomoChannel(phone233: string): MomoChannel {
  const local = toLocalMsisdn(phone233);
  const prefix = local.slice(0, 3);

  if (["024", "054", "055", "059"].includes(prefix)) return "mtn-gh";
  if (["020", "050"].includes(prefix)) return "vodafone-gh";
  return "tigo-gh";
}
