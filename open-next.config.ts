import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Non-interactive configuration for CI and Cloudflare Worker builds.
// No cache bindings are enabled until isolated Cloudflare resources are provisioned.
export default defineCloudflareConfig();
