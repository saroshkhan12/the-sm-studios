/** Isolated design tokens for opt-in landing page components. Never imported by global styles. */
export const landingPageTokens = {
  type: { xs:12, sm:14, base:16, lg:18, xl:20, "2xl":24, "3xl":30, "4xl":36, "5xl":48, "6xl":60, "7xl":72, "8xl":96, "9xl":128 },
  spacing: { 0:0, 25:2, 50:4, 75:8, 100:12, 200:16, 300:24, 400:32, 500:40, 600:48, 700:64, 800:80, 900:96 },
  motion: { curve: "cubic-bezier(0.22, 1, 0.36, 1)", duration: 500, colorDuration: 300 },
} as const;

export const landingPageTextStyles = {
  h1:"lp-h1", h2:"lp-h2", h3:"lp-h3", h4:"lp-h4", h5:"lp-h5", h6:"lp-h6",
  title1:"lp-title-1", title2:"lp-title-2", title3:"lp-title-3", title4:"lp-title-4", title5:"lp-title-5",
  body1:"lp-body-1", body2:"lp-body-2", body3:"lp-body-3", body4:"lp-body-4", body5:"lp-body-5", body6:"lp-body-6",
  buttonLg:"lp-button-lg", buttonMd:"lp-button-md", buttonSm:"lp-button-sm", buttonXs:"lp-button-xs",
  caption1:"lp-caption-1", caption2:"lp-caption-2", caption3:"lp-caption-3", caption4:"lp-caption-4", caption5:"lp-caption-5",
} as const;
