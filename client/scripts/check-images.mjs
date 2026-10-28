/**
 * Checks that every image path in src/config/assets.ts points to a real file,
 * and warns about your own photos saved inside the generated placeholders folder.
 * Run: npm run check:images
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const config = readFileSync(join(root, 'src/config/assets.ts'), 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('/**') && !line.trim().startsWith('*') && !line.trim().startsWith('//'))
  .join('\n')

const paths = [
  ...[...config.matchAll(/'(\/assets\/[^']+)'/g)].map((m) => m[1]),
  ...[...config.matchAll(/ph\('([^']+)'\)/g)].map((m) => `/assets/placeholders/${m[1]}`),
]

let problems = 0
console.log('Image paths in src/config/assets.ts:')
for (const p of paths) {
  const ok = existsSync(join(publicDir, p))
  if (!ok) problems++
  console.log(`  ${ok ? 'OK     ' : 'MISSING'}  ${p}`)
}

// Your own photos (png/jpg/webp) never belong in the generated placeholders folder.
const misplaced = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (/\.(png|jpe?g|webp)$/i.test(name)) misplaced.push(full)
  }
}
const placeholders = join(publicDir, 'assets/placeholders')
if (existsSync(placeholders)) walk(placeholders)
if (misplaced.length) {
  console.log('\nThese photos are inside the placeholders folder — move them up one level:')
  for (const f of misplaced) {
    const rel = relative(publicDir, f).replaceAll('\\', '/')
    console.log(`  ${rel}  →  ${rel.replace('assets/placeholders/', 'assets/')}`)
  }
}

const sizeWarnings = []
const checkSizes = (dir) => {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) checkSizes(full)
    else if (/\.(png|jpe?g|webp)$/i.test(name) && statSync(full).size > 500 * 1024 && !full.includes('placeholders')) {
      sizeWarnings.push(`  ${relative(publicDir, full).replaceAll('\\', '/')}  (${Math.round(statSync(full).size / 1024)} KB)`)
    }
  }
}
checkSizes(join(publicDir, 'assets'))
if (sizeWarnings.length) {
  console.log('\nLarge files (over 500 KB) — these slow the site; save as JPG/WebP around 200–300 KB:')
  console.log(sizeWarnings.join('\n'))
}

console.log(problems || misplaced.length ? '\n✗ Fix the items above.' : '\n✓ All image paths are fine.')
process.exit(problems ? 1 : 0)
