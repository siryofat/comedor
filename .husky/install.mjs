// Skip hooks where dev dependencies or Git are unavailable.
if (process.env.CI || process.env.NODE_ENV === 'production' || process.env.HUSKY === '0')
  process.exit(0)
const { default: husky } = await import('husky')
const result = husky()
if (result) {
  console.error(result)
  process.exitCode = 1
}
