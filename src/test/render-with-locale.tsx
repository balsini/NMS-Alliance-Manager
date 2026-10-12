import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/components/providers/locale-provider";
import type { Locale } from "@/lib/translations";

export function renderWithLocale(element: ReactElement, locale: Locale = "it") {
  return renderToStaticMarkup(<LocaleProvider fixedLocale={locale}>{element}</LocaleProvider>);
}
