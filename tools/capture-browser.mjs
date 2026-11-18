import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const bundledCache = fileURLToPath(new URL('../test-results/playwright-browsers/', import.meta.url));
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(bundledCache))
  process.env.PLAYWRIGHT_BROWSERS_PATH = bundledCache;
const {chromium} = await import('playwright');

export function launchChromium({backend = 'swiftshader', headed = false} = {}) {
  const args = ['--enable-webgl'];
  if (backend === 'swiftshader') {
    args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  } else {
    args.push('--disable-software-rasterizer', '--use-gl=angle');
  }
  return chromium.launch({
    headless: !headed,
    executablePath: process.env.CHROMATRON_CHROME_PATH || undefined,
    channel: backend==='native'&&!process.env.CHROMATRON_CHROME_PATH?'chromium':undefined,
    args
  });
}
