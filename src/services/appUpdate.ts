// In-app update check for the self-distributed APK.
//
// Primary source: GitHub Releases (simplest — you just publish a release with
// the .apk attached and the app auto-detects it via GitHub's public API, no
// auth needed for public repos). Configure the repo via EXPO_PUBLIC_GITHUB_REPO
// ("owner/name"). If that isn't set, it falls back to a Firestore doc
// (appConfig/latest). Never throws, so startup is never blocked.

import { doc, getDoc } from 'firebase/firestore';
import Constants from 'expo-constants';
import { getDb } from './firebase';
import { isNewerVersion } from '@/logic/version';

export interface LatestVersion {
  version: string; // e.g. "1.0.1"
  apkUrl: string; // direct download link (.apk) or release page
  notes?: string;
  mandatory?: boolean;
}

export interface UpdateStatus {
  available: boolean;
  current: string;
  latest?: LatestVersion;
  checked: boolean; // false when the check itself failed (offline etc.)
}

/** The version this build was compiled with (from app.config.js `version`). */
export function currentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

function githubRepo(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { githubRepo?: string };
  return (extra.githubRepo ?? '').trim();
}

async function fromGitHub(repo: string, current: string): Promise<UpdateStatus> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return { available: false, current, checked: false };
  const data = (await res.json()) as {
    tag_name?: string;
    body?: string;
    html_url?: string;
    assets?: { name?: string; browser_download_url?: string }[];
  };
  const version = String(data.tag_name ?? '').replace(/^v/i, '').trim();
  if (!version) return { available: false, current, checked: true };
  const apk = (data.assets ?? []).find((a) => String(a.name ?? '').toLowerCase().endsWith('.apk'));
  const apkUrl = apk?.browser_download_url ?? data.html_url ?? '';
  return {
    available: isNewerVersion(version, current),
    current,
    checked: true,
    latest: { version, apkUrl, notes: data.body ?? '' },
  };
}

async function fromFirestore(current: string): Promise<UpdateStatus> {
  const snap = await getDoc(doc(getDb(), 'appConfig', 'latest'));
  if (!snap.exists()) return { available: false, current, checked: true };
  const latest = snap.data() as LatestVersion;
  if (!latest.version || !latest.apkUrl) return { available: false, current, checked: true };
  return { available: isNewerVersion(latest.version, current), current, checked: true, latest };
}

/** Check whether a newer version is published. */
export async function checkForUpdate(): Promise<UpdateStatus> {
  const current = currentVersion();
  try {
    const repo = githubRepo();
    return repo ? await fromGitHub(repo, current) : await fromFirestore(current);
  } catch {
    return { available: false, current, checked: false };
  }
}
