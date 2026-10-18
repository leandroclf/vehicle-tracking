"""No-network tests for staging dry-run bundle fingerprint and fail-closed behavior."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "verify-staging-dry-run.py"
SPEC = importlib.util.spec_from_file_location("verify_staging", SCRIPT)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class StagingBundleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.sha = "a" * 40
        (self.root / "index.js").write_text("export default {fetch() { return Response.json({ok:true}) }}")

    def test_valid_bundle_does_not_claim_cloud_deploy(self):
        report = module.fingerprint(self.root, self.sha)
        self.assertEqual(report["status"], "OFFLINE_STAGING_BUNDLE_VERIFIED")
        self.assertEqual(len(report["bundles"]), 1)
        self.assertEqual(len(report["bundles"][0]["sha256"]), 64)
        self.assertFalse(report["remote_cloudflare_verified"])
        self.assertFalse(report["deployment_executed"])
        self.assertFalse(report["authorized_to_deploy"])

    def test_missing_empty_or_linked_bundle_blocks(self):
        (self.root / "index.js").unlink()
        with self.assertRaises(ValueError):
            module.fingerprint(self.root, self.sha)
        (self.root / "index.js").write_bytes(b"")
        with self.assertRaises(ValueError):
            module.fingerprint(self.root, self.sha)
        (self.root / "index.js").unlink()
        (self.root / "index.js").symlink_to(self.root / "missing.js")
        with self.assertRaises(ValueError):
            module.fingerprint(self.root, self.sha)

    def test_manifest_is_sanitized_private_and_non_overwriting(self):
        import json
        import stat
        destination = self.root / "manifest.json"
        report = module.fingerprint(self.root, self.sha)
        module.write_manifest(destination, report)
        saved = json.loads(destination.read_text())
        self.assertEqual(saved["source_sha"], self.sha)
        self.assertFalse(saved["authorized_to_deploy"])
        self.assertEqual(stat.S_IMODE(destination.stat().st_mode), 0o600)
        with self.assertRaises(ValueError):
            module.write_manifest(destination, report)

    def test_manifest_rejects_symlink_or_missing_parent(self):
        report = module.fingerprint(self.root, self.sha)
        target = self.root / "real.json"
        target.write_text("keep")
        linked = self.root / "linked.json"
        linked.symlink_to(target)
        with self.assertRaises(ValueError):
            module.write_manifest(linked, report)
        self.assertEqual(target.read_text(), "keep")
        with self.assertRaises(ValueError):
            module.write_manifest(self.root / "missing" / "manifest.json", report)

    def test_invalid_source_and_linked_directory_block(self):
        with self.assertRaises(ValueError):
            module.fingerprint(self.root, "main")
        alias = self.root.parent / (self.root.name + "-link")
        alias.symlink_to(self.root)
        self.addCleanup(alias.unlink)
        with self.assertRaises(ValueError):
            module.fingerprint(alias, self.sha)


if __name__ == "__main__":
    unittest.main()
