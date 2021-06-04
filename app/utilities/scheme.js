import { LightTheme, DarkTheme } from "../components/styles.store"

export const schemeRule = (shadow, style, light, dark) => {
  const lightScheme = light
      ? [style, LightTheme, light]
      : [style, LightTheme]

  const darkScheme = dark
      ? [style, DarkTheme, dark]
      : [style, DarkTheme]

  return attr => {
    if (attr === "light")
      shadow.adoptedStyleSheets = lightScheme
    else if (attr === "dark")
      shadow.adoptedStyleSheets = darkScheme
    else
      shadow.adoptedStyleSheets = [style]
  }
}
