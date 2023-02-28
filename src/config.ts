// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "/home/s3r0s4pi3ns";
export const SITE_DESCRIPTION =
  "Give me a shell and I'll turn the world around.";
export const TWITTER_HANDLE = "@s3r0s4pi3ns";
export const MY_NAME = "s3r0s4pi3ns";

// setup in astro.config.mjs
const BASE_URL = new URL(import.meta.env.SITE);
export const SITE_URL = BASE_URL.origin;
