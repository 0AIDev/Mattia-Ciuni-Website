/**
 * Return the mailbox identity used for newsletter deduplication.
 *
 * Gmail treats dots in the local part as insignificant and treats everything
 * after `+` as a label. Other providers are deliberately only lowercased:
 * their alias rules differ, so guessing would risk merging two real people.
 */
export function canonicalizeSubscriberEmail(input: string): string {
  const email = input.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return email;

  let local = email.slice(0, at);
  let domain = email.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";

  if (domain === "gmail.com") {
    local = local.split("+", 1)[0].replace(/\./g, "");
  }

  return `${local}@${domain}`;
}
