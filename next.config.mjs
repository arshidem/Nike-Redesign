const nextConfig = { poweredByHeader: false, experimental: { webpackBuildWorker: false, cpus: 2 }, serverExternalPackages: ['mongoose', 'express', 'cloudinary', 'razorpay'], outputFileTracingExcludes: { '*': ['./backend/uploads/**', './nike/node_modules/**', './backend/node_modules/**'] } };
export default nextConfig;
