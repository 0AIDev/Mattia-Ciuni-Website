"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { CustomDropdown } from "@/components/CustomDropdown";
import { track } from "@/lib/analytics";
import { LANGUAGE_STORAGE_KEY, LOCALES, isLocale, localeMeta, localizedPath, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  label: string;
};

function pathWithoutLocale(pathname: string) {
  const firstSegment = pathname.split("/")[1] || "";
  if (!isLocale(firstSegment)) return pathname || "/";
  return pathname.slice(firstSegment.length + 1) || "/";
}

export function LanguageSwitcher({ currentLocale, label }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() || "/";

  function changeLanguage(nextLocale: Locale) {
    const barePath = pathWithoutLocale(pathname);
    const destination = nextLocale === "en" ? barePath : localizedPath(nextLocale, barePath);
    const query = window.location.search;
    const hash = window.location.hash;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify({ locale: nextLocale, dismissedAt: Date.now() }));
    track("language_switch", { from_locale: currentLocale, to_locale: nextLocale, source: "footer" });
    router.push(`${destination}${query}${hash}`, { scroll: false });
  }

  const options = LOCALES.map((locale) => ({
    value: locale,
    label: localeMeta[locale].native,
    suffix: locale.toUpperCase(),
    leading: <Image src={`/flags/${localeMeta[locale].country.toLowerCase()}.svg`} alt="" width={20} height={20} unoptimized className="language-switcher-flag" />,
  }));

  return (
    <CustomDropdown
      value={currentLocale}
      options={options}
      onChange={(nextLocale) => changeLanguage(nextLocale as Locale)}
      label={label}
      className="w-[158px]"
      compact
    />
  );
}
