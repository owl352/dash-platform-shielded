// Generates the orchard napi TypeScript declarations (the proving NAPI surface:
// ShieldedBuilderNAPI, ShieldedProverNAPI, ...). pshenmic-dpp's shielded JS
// wrappers import these types from 'pshenmic-orchard/bindingsTypes' so they can
// type-check against the proving module they delegate to at runtime, without
// dpp itself compiling any proving code.
//
// Mirrors dpp's generateTypings(): a host `napi build --dts` into a temp dir (so
// the .node output never lands in the package), keeping only the declarations.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const BIN_NAME = 'pshenmic_orchard'

export async function genTypings () {
  const { NapiCli } = await import('@napi-rs/cli')
  const tempDir = fs.mkdtempSync(path.join(REPO, 'dts-tmp-'))

  // Host build on macOS with Homebrew clang first in PATH: aws-lc must use the
  // system compiler (same override dpp's generateTypings gets).
  if (process.platform === 'darwin') {
    process.env.AWS_LC_SYS_TARGET_CC_aarch64_apple_darwin ??= '/usr/bin/cc'
    process.env.AWS_LC_SYS_TARGET_CXX_aarch64_apple_darwin ??= '/usr/bin/c++'
  }

  try {
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}')
    const { task } = await new NapiCli().build({
      dts: `${BIN_NAME}.d.ts`,
      outputDir: tempDir,
      cwd: REPO,
      cargoOptions: ['--quiet'],
    })
    await task

    const dts = fs.readFileSync(path.join(tempDir, `${BIN_NAME}.d.ts`), 'utf8')
    const distDir = path.join(REPO, 'dist', 'binaries')
    fs.mkdirSync(distDir, { recursive: true })
    // The proving NAPI surface dpp's wrappers import as types.
    fs.writeFileSync(path.join(distDir, 'bindingsTypes.d.ts'), dts)
    console.log(`Generated orchard napi typings -> dist/bindingsTypes.d.ts`)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  genTypings().catch((e) => { console.error(e); process.exit(1) })
}