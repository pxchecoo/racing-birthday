export interface RsvpInput {
  name: string;
  attending: boolean;
  guest_count: number;
  message: string | null;
}
export function validateRsvp(input: RsvpInput) {
  if (!input.name.trim() || input.name.trim().length > 100)
    return "Please enter your name (up to 100 characters).";
  if (
    !Number.isInteger(input.guest_count) ||
    input.guest_count < 0 ||
    input.guest_count > 10
  )
    return "Please choose between 0 and 10 additional guests.";
  if (!input.attending && input.guest_count !== 0)
    return "A declined invitation cannot include guests.";
  if ((input.message?.length ?? 0) > 1000)
    return "Please keep your message under 1,000 characters.";
  return null;
}
