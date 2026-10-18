// OpenNext Cloudflare 0.3.x uses the v3 OpenNextConfig object, not
// defineCloudflareConfig() from later adapter versions.
// Disable KV-backed caches until staging bindings are provisioned.
const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
};

export default config;
