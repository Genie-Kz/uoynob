#!/usr/bin/env node
// GitHub Actions ワークフローを actionlint で検証する。
//
// 公式リリースのバイナリを「バージョン固定 + SHA256 検証」で取得し、node_modules 配下に
// キャッシュして実行する。Go や Docker を必要とせず、ローカル(Windows 含む)と CI で同一に動く。
// バージョンを上げるときは ACTIONLINT_VERSION と CHECKSUMS の両方を更新すること。
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ACTIONLINT_VERSION = '1.7.12';

// 配布アーカイブ名 → SHA256。公式の checksums.txt から必要プラットフォーム分だけ転記する。
const CHECKSUMS = {
  'actionlint_1.7.12_linux_amd64.tar.gz':
    '8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8',
  'actionlint_1.7.12_linux_arm64.tar.gz':
    '325e971b6ba9bfa504672e29be93c24981eeb1c07576d730e9f7c8805afff0c6',
  'actionlint_1.7.12_darwin_amd64.tar.gz':
    '5b44c3bc2255115c9b69e30efc0fecdf498fdb63c5d58e17084fd5f16324c644',
  'actionlint_1.7.12_darwin_arm64.tar.gz':
    'aba9ced2dee8d27fecca3dc7feb1a7f9a52caefa1eb46f3271ea66b6e0e6953f',
  'actionlint_1.7.12_windows_amd64.zip':
    '6e7241b51e6817ea6a047693d8e6fed13b31819c9a0dd6c5a726e1592d22f6e9',
  'actionlint_1.7.12_windows_arm64.zip':
    'cadcf7ea4efe3a68728893813643cebe1185e5b1d4be5b96245f65c9a4d5ea41',
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const isWindows = process.platform === 'win32';

// 実行プラットフォームから、ダウンロードすべきアーカイブ名を決める。
function resolveAssetName() {
  const osName = { win32: 'windows', darwin: 'darwin', linux: 'linux' }[process.platform];
  const archName = { x64: 'amd64', arm64: 'arm64' }[process.arch];
  if (!osName || !archName) {
    throw new Error(`未対応のプラットフォームです: ${process.platform}/${process.arch}`);
  }
  const ext = osName === 'windows' ? 'zip' : 'tar.gz';
  return `actionlint_${ACTIONLINT_VERSION}_${osName}_${archName}.${ext}`;
}

// 取得済みバイナリのパス。バージョンごとに分けてキャッシュする。
function binaryPath() {
  const cacheDir = join(repoRoot, 'node_modules', '.cache', 'actionlint', ACTIONLINT_VERSION);
  return { cacheDir, bin: join(cacheDir, isWindows ? 'actionlint.exe' : 'actionlint') };
}

// アーカイブを取得し、SHA256 を検証してから展開し、実行可能なバイナリを用意する。
async function ensureBinary() {
  const { cacheDir, bin } = binaryPath();
  // 既にキャッシュ済みなら何もしない。
  if (existsSync(bin)) return bin;

  const asset = resolveAssetName();
  const expected = CHECKSUMS[asset];
  if (!expected) throw new Error(`チェックサム未登録のアーカイブです: ${asset}`);

  const url = `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/${asset}`;
  process.stderr.write(`actionlint ${ACTIONLINT_VERSION} を取得します: ${url}\n`);

  const response = await fetch(url); // fetch はリダイレクトを自動で追従する
  if (!response.ok) throw new Error(`ダウンロードに失敗しました (HTTP ${response.status}): ${url}`);
  const archive = Buffer.from(await response.arrayBuffer());

  // 改ざん検知のため、配布元のSHA256と一致するか確認する。
  const actual = createHash('sha256').update(archive).digest('hex');
  if (actual !== expected) {
    throw new Error(`SHA256 不一致のため中止します。\n  期待: ${expected}\n  実際: ${actual}`);
  }

  mkdirSync(cacheDir, { recursive: true });
  const archivePath = join(cacheDir, asset);
  writeFileSync(archivePath, archive);

  // Windows は .zip を PowerShell の Expand-Archive で、その他は .tar.gz を tar で展開する。
  // （Git付属の GNU tar は .zip 非対応かつ "D:" をリモートホストと誤認するため tar は使わない）
  const extracted = isWindows
    ? spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${cacheDir}' -Force`,
        ],
        { stdio: 'inherit' },
      )
    : spawnSync('tar', ['-xzf', archivePath, '-C', cacheDir], { stdio: 'inherit' });
  if (extracted.status !== 0) {
    throw new Error('アーカイブの展開に失敗しました');
  }
  if (!isWindows) chmodSync(bin, 0o755);
  return bin;
}

async function main() {
  let bin;
  try {
    bin = await ensureBinary();
  } catch (error) {
    process.stderr.write(
      `[actionlint] ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }

  // 追加引数はそのまま actionlint へ渡す（無指定なら全ワークフローを検証する）。
  const result = spawnSync(bin, process.argv.slice(2), { stdio: 'inherit', cwd: repoRoot });
  if (result.error) {
    process.stderr.write(`[actionlint] 実行に失敗しました: ${result.error.message}\n`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

void main();
