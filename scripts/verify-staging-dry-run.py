#!/usr/bin/env python3
"""Offline staging bundle fingerprint. Not a deploy approval or Cloudflare attestation."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys

SHA = re.compile(r"^[0-9a-f]{40}$")
MAX_BUNDLE = 128 * 1024 * 1024


def fingerprint(directory, source_sha):
    if not isinstance(source_sha, str) or not SHA.fullmatch(source_sha):
        raise ValueError("Invalid Git source SHA")
    directory = Path(directory)
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError("Missing or linked Wrangler dry-run directory")
    bundles = []
    for item in directory.rglob("*"):
        if item.is_symlink():
            raise ValueError("Linked dry-run output is not allowed")
        if item.is_dir():
            continue
        if not item.is_file():
            raise ValueError("Unexpected nonregular dry-run file")
        if item.suffix != ".js":
            continue
        info = item.stat(follow_symlinks=False)
        if not stat.S_ISREG(info.st_mode) or not 0 < info.st_size <= MAX_BUNDLE:
            raise ValueError("Invalid Worker bundle")
        digest = hashlib.sha256()
        with item.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        after = item.stat(follow_symlinks=False)
        if (info.st_ino, info.st_size, info.st_mtime_ns) != (
                after.st_ino, after.st_size, after.st_mtime_ns):
            raise ValueError("Bundle changed while being hashed")
        bundles.append({"file": item.relative_to(directory).as_posix(), "sha256": digest.hexdigest()})
    if not bundles:
        raise ValueError("No JavaScript Worker bundle produced by dry-run")
    return {
        "status": "OFFLINE_STAGING_BUNDLE_VERIFIED",
        "source_sha": source_sha,
        "bundles": sorted(bundles, key=lambda x: x["file"]),
        "remote_cloudflare_verified": False,
        "deployment_executed": False,
        "authorized_to_deploy": False,
    }


def write_manifest(destination, report):
    """Write a sanitized manifest once; never replace existing files or links."""
    destination = Path(destination)
    if destination.parent.is_symlink() or not destination.parent.is_dir():
        raise ValueError("Evidence directory missing or linked")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0)
    try:
        fd = os.open(destination, flags, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2, sort_keys=True)
            handle.write("\n")
    except OSError as exc:
        raise ValueError("Cannot create new evidence manifest") from exc


def main():
    parser = argparse.ArgumentParser(description="Fingerprint only Wrangler staging dry-run bundles")
    parser.add_argument("--directory", required=True, type=Path)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--output", type=Path, help="new sanitized manifest file; existing paths are refused")
    args = parser.parse_args()
    try:
        result = fingerprint(args.directory, args.source_sha)
        if args.output is not None:
            write_manifest(args.output, result)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (ValueError, OSError):
        print(json.dumps({"status": "BLOCKED", "deployment_executed": False,
                          "authorized_to_deploy": False}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
