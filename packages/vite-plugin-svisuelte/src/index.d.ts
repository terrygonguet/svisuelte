import type { Plugin } from "vite"

export interface SvisuelteOptions {
	/**
	 * @default "./src"
	 */
	root?: string

	/**
	 * @default "/svisuelte"
	 */
	route?: string

	/**
	 * @default false
	 */
	dev?: boolean
}

export function svisuelte(options?: SvisuelteOptions): Plugin
