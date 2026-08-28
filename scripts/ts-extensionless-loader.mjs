export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !specifier.endsWith('.ts') && !specifier.endsWith('.js')) {
    try {
      return await nextResolve(`${specifier}.ts`, context)
    } catch {
      // Let Node report the original resolution error for non-TypeScript imports.
    }
  }

  return nextResolve(specifier, context)
}
