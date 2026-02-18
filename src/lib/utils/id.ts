import { customAlphabet } from "nanoid";

const generate = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 12);

export function createOrderId(): string {
  return generate();
}
