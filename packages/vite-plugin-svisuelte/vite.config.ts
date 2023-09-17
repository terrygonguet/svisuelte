import { svelte } from "@sveltejs/vite-plugin-svelte"
import { viteSingleFile } from "vite-plugin-singlefile"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [svelte({ emitCss: false }), viteSingleFile()],
})
