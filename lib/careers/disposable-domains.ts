const disposableDomains = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "discard.email",
  "emailondeck.com",
  "fakeinbox.com",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "maildrop.cc",
  "mailinator.com",
  "mintemail.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "yopmail.com",
]);

export function isDisposableCareerEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@").pop() || "";
  return disposableDomains.has(domain);
}

export function disposableCareerDomains(): string[] {
  return [...disposableDomains].sort();
}
