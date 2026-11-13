import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',
 // Browser tests still check real Three.js rendering. Allow CI's software
 // rasterizer a larger scheduling budget without changing local feedback.
 timeout:process.env.CI?75000:45000,
 expect:{timeout:process.env.CI?15000:10000},
 fullyParallel:false,
 retries:process.env.CI?1:0,
 reporter:process.env.CI?[['list'],['html',{open:'never',outputFolder:'playwright-report'}]]:'list',
 use:{
  baseURL:'http://127.0.0.1:4173',
  trace:'retain-on-failure',
  screenshot:'only-on-failure',
  launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}
 },
 projects:[{name:'chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}}],
 webServer:{
  command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
  url:'http://127.0.0.1:4173',
  reuseExistingServer:!process.env.CI,
  timeout:120000
 }
});
