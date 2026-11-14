import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {localCampaignPlugin} from './scripts/local-campaigns.mjs';

// The development server runs inside sandboxed preview environments whose
// hostname is assigned at runtime. Vite 7 otherwise rejects that Host header.
// This only affects `vite dev` / `vite preview`; the production build and the
// static bundle are unchanged.
export default defineConfig({
 plugins:[localCampaignPlugin(fileURLToPath(new URL('./original/',import.meta.url)))],
 server:{allowedHosts:true,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/original/**','**/remake/**']}},
 preview:{allowedHosts:true}
});
