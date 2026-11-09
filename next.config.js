/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  outputFileTracingIncludes: { "/api/**": ["./assets/fonts/**"] },
};

module.exports = nextConfig;
