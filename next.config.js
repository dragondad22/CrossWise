/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  // CrossWise lives on crosswise.buildyouralpaca.com so the shared sign-in cookie
  // reaches it (ADR-009). Send visitors of the old address there.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'crosswise.vercel.app' }],
        destination: 'https://crosswise.buildyouralpaca.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
