import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";

export function getAvatar(seed) {
  return createAvatar(personas, {
    seed: String(seed),
  }).toDataUri();
}
