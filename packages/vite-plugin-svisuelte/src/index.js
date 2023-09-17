import { parse } from "svelte/compiler"
import { readFile, readdir } from "fs/promises"

const pluginDevMode = process.env.SVISUELTE_DEV == "true"

const pluginPath = import.meta.url.replace("file:///C:", "")
const htmlPath = pluginPath.replace("/src/index.js", "/dist/index.html")

let html

/**
 * @param {import(".").SvisuelteOptions} options
 * @returns {import("vite").Plugin}
 */
export function svisuelte({
	root = "./src",
	route = "/svisuelte",
	dev = false,
} = {}) {
	return {
		name: "vite-plugin-svisuelte",
		async buildStart() {
			html = await readFile(htmlPath)
		},
		configureServer(devServer) {
			devServer.middlewares.use(route, async (req, res, next) => {
				if (pluginDevMode) {
					html = await readFile(htmlPath)
				}

				res.setHeader("Content-Type", "text/html").end(html)
			})

			devServer.middlewares.use(
				"/svisuelte__internal",
				async (req, res, next) => {
					switch (req.method) {
						case "GET":
							const ast = await getAST(root + req.url)
							res.setHeader(
								"Content-Type",
								"application/json",
							).end(JSON.stringify(ast))
							break
						case "PUT":
							break
						default:
							next()
							break
					}
				},
			)
		},
	}
}

/**
 * @param {string} path
 */
async function getAST(path) {
	const source = await readFile(path)
	const ast = parse(source.toString())
	return ast
}
