#!/usr/bin/env python3
"""Provision error-page keyword monitors against Uptime Kuma's REST API v1.

Reads the bootstrap API key from ~/.secrets/.env (UPTIME_KUMA_BOOTSTRAP_API_KEY)
and creates one keyword monitor per target service. Idempotent — skips any
target that already has a monitor whose name matches the canonical
"<service> · keyword" pattern.

Kuma's `invertKeyword` semantics (don't trust the name):
  invertKeyword=False (default) → UP when keyword PRESENT in body.
  invertKeyword=True            → UP when keyword ABSENT from body.

Two patterns we use:
  invert=False → keyword is the EXPECTED content; alert when it's MISSING.
                 Used for public-facing pages where we know a stable element.
  invert=True  → keyword is an ERROR string; alert when it APPEARS.
                 Used for OIDC-gated apps where '/' is a 302 to Microsoft.

Usage:
  python3 scripts/provision-keyword-monitors.py [--dry-run]
"""

from __future__ import annotations
import os
import sys
import json
import argparse
import urllib.request
import urllib.error
import base64
from pathlib import Path

API_BASE = os.environ.get("KUMA_BASE", "https://uptime.aspendora.com")


def load_api_key() -> str:
    """Resolve the API key, expanding shell-style $VAR references in the .env."""
    for var in ("UPTIME_KUMA_BOOTSTRAP_API_KEY", "UPTIME_ASPENDORA_KUMA_API_KEY", "UPTIME_KUMA_API_KEY"):
        if (k := os.environ.get(var)):
            if not k.startswith("$"):
                return k
    secrets = Path.home() / ".secrets" / ".env"
    if not secrets.exists():
        sys.exit("No env var set and ~/.secrets/.env missing")
    # Two-pass: first collect all assignments verbatim, then resolve $VAR refs.
    raw: dict[str, str] = {}
    for line in secrets.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        raw[k.strip()] = v.strip().strip('"').strip("'")
    def resolve(v: str, depth: int = 0) -> str:
        if depth > 5 or not v.startswith("$"):
            return v
        return resolve(raw.get(v[1:], ""), depth + 1)
    for name in ("UPTIME_KUMA_BOOTSTRAP_API_KEY", "UPTIME_ASPENDORA_KUMA_API_KEY"):
        if name in raw:
            v = resolve(raw[name])
            if v:
                return v
    sys.exit("Couldn't resolve a Kuma API key from ~/.secrets/.env")


def basic_auth_header(api_key: str) -> str:
    raw = f":{api_key}".encode()
    return "Basic " + base64.b64encode(raw).decode()


def kuma(method: str, path: str, api_key: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}{path}",
        method=method,
        headers={
            "Authorization": basic_auth_header(api_key),
            "Content-Type": "application/json",
            "Accept": "application/json",
            # Cloudflare bans the default urllib user-agent; pretend to be a browser.
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
        data=json.dumps(body).encode() if body else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode(errors="replace")
        sys.exit(f"{method} {path} failed: {e.code} {msg}")


# (name suffix, url, keyword, invert)
TARGETS: list[tuple[str, str, str, bool]] = [
    # Public-facing — match expected content, alert when missing
    ("controlr",          "https://control.aspendora.com/",          "_framework/dotnet",        False),
    ("callqa",            "https://callqa.aspendora.com/",           "Call QA Dashboard",        False),
    ("file-share-blazor", "https://share.aspendora.com/",            "Aspendora File Share",     False),
    ("imtec-sql-ip",      "https://imtec-sql-ip.aspendora.com/",     "IMTEC SQL IP",             False),
    ("infodex",           "https://infodex.ir100.com/",              "Infodex",                  False),
    ("media-toolkit",     "https://media-toolkit.aspendora.com/",    "Media Toolkit",            False),
    ("people-directory",  "https://people.3endt.com/",               "People Directory",         False),
    ("user-management",   "https://user-management.aspendora.com/",  "User Management Portal",   False),
    ("aspendora-console", "https://rd.aspendora.com/",               "Aspendora Remote Console", False),
    ("n8n",               "https://automations.aspendora.com/",      "Aspendora Automations",    False),
    ("formbricks",        "https://surveys.aspendora.com/",          "Formbricks",               False),
    ("meshcentral",       "https://central.aspendora.com/",          "Aspendora",                False),
    ("defiant-editor",    "https://defiant-editor.aspendora.com/",   "Defiant Markdown Editor",  False),
    ("defiant-mgmt",      "https://defiant-mgmt.aspendora.com/",     "Defiant Management",       False),
    ("openclaw",          "http://10.10.30.101:18789/",              "OpenClaw Control",         False),

    # OIDC-gated — match ASP.NET error string, alert when present
    ("servicetracker",    "http://10.10.30.101:8280/",               "An error occurred while processing your request", True),
    ("aspendorachat",     "https://chat.aspendora.com/",             "An error occurred while processing your request", True),
    ("emailbridge",       "https://emailbridge.aspendora.com/",      "An error occurred while processing your request", True),
    ("ticket-auditor",    "https://tickets-analysis.aspendora.com/", "An error occurred while processing your request", True),
    ("homepro",           "https://upgrade-3endt.aspendora.com/",    "An error occurred while processing your request", True),
]

NAME_SUFFIX = " · keyword"


def existing_keyword_monitors(api_key: str) -> dict[str, int]:
    """Return {name: id} for any monitor whose name ends with NAME_SUFFIX."""
    env = kuma("GET", "/api/v1/monitors", api_key)
    out: dict[str, int] = {}
    for m in env["data"].values():
        if m["name"].endswith(NAME_SUFFIX):
            out[m["name"]] = m["id"]
    return out


def build_body(name: str, url: str, keyword: str, invert: bool) -> dict:
    # homepro sits behind oauth2-proxy, which returns 403 to anonymous requests.
    # That 403 is the expected healthy response; treat it as a success code.
    accepted = ["200-299", "302"]
    if "homepro" in name or "upgrade-3endt" in url:
        accepted.append("403")
    return {
        "name": name,
        "type": "keyword",
        "url": url,
        "keyword": keyword,
        "invertKeyword": invert,
        "interval": 120,
        "retryInterval": 60,
        "maxretries": 2,
        "timeout": 30,
        "method": "GET",
        "maxredirects": 10,
        "ignoreTls": False,
        "upsideDown": False,
        "expiryNotification": False,
        "domainExpiryNotification": False,
        "accepted_statuscodes": accepted,
        "notificationIDList": {},
        "active": True,
        "description": (
            f"Keyword monitor — alert when "
            f"{'error string' if invert else 'expected content'} "
            f"{'appears' if invert else 'disappears'}: \"{keyword}\""
        ),
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    api_key = load_api_key()
    print(f"→ Authenticating to {API_BASE}")
    existing = existing_keyword_monitors(api_key)
    print(f"  found {len(existing)} pre-existing keyword monitors")

    created = skipped = 0
    for slug, url, keyword, invert in TARGETS:
        name = f"{slug}{NAME_SUFFIX}"
        if name in existing:
            print(f"  skip   {name:42s} (id={existing[name]})")
            skipped += 1
            continue
        body = build_body(name, url, keyword, invert)
        if args.dry_run:
            mode = "expects" if invert else "errors-on"
            print(f"  DRY    {name:42s} {mode:10s} kw={keyword!r:50s}")
            continue
        env = kuma("POST", "/api/v1/monitors", api_key, body)
        new_id = env["data"]["monitorID"]
        mode = "expects" if invert else "errors-on"
        print(f"  create {name:42s} id={new_id:<4} {mode:10s} kw={keyword!r}")
        created += 1

    print(f"\n→ Done. Created {created}, skipped {skipped}.")


if __name__ == "__main__":
    main()
