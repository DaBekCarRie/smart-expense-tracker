/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl || apiUrl.includes("localhost")) {
  const msg = apiUrl
    ? `NEXT_PUBLIC_API_URL points to localhost ("${apiUrl}"). Set it to the production backend URL before deploying.`
    : "NEXT_PUBLIC_API_URL is not set. API calls will fail in production.";
  // Warn in CI/production builds; allow localhost during local dev
  if (process.env.NODE_ENV === "production") {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`);
  }
}

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
