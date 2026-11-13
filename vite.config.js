import {defineConfig} from 'vite';

// The development server runs inside sandboxed preview environments whose
// hostname is assigned at runtime. Vite 7 otherwise rejects that Host header.
// This only affects `vite dev` / `vite preview`; the production build and the
// static bundle are unchanged.
export default defineConfig({
 server:{allowedHosts:true},
 preview:{allowedHosts:true}
});
