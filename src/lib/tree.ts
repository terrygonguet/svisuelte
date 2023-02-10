import { exhaustive } from "$lib/utils"

type DOMElement = {
	type: "element"
	tagName: string
	attributes: [string, string][]
	children: Node[]
}

type ComponentElement = {
	type: "component"
	name: string
	src: string
	properties: [string, any][]
	children: Node[]
}

type ControlElement =
	| {
			type: "if"
			branches: { condition: string; children: Node[] }[]
			else?: Node[]
	  }
	| {
			type: "each"
			expression: string
			as: string
			key?: string
			index?: string
			children: Node[]
			else?: Node[]
	  }
	| {
			type: "await"
			expression: string
			then: { expression: string; children: Node[] }
			catch?: { expression: string; children: Node[] }
	  }
	| {
			type: "await:catch"
			expression: string
			catch: { expression: string; children: Node[] }
	  }
	// TODO: Add await:then variant or collapse into only await
	| {
			type: "key"
			expression: string
			children: Node[]
	  }
	| {
			type: "expression"
			expression: string
	  }
	| {
			type: "html"
			expression: string
	  }

type Element = DOMElement | ComponentElement | ControlElement

type Node = {
	element: Element
	prev?: Node
	next?: Node
	parent?: Node
}

export class Tree {
	root: Node
	selected: Node
	selectedPart = 0

	constructor() {
		this.root = { element: { type: "element", tagName: "div", children: [], attributes: [] } }
		this.selected = this.root
	}

	//#region private utils
	private collectChildren(element: Element) {
		switch (element.type) {
			case "element":
			case "component":
				return element.children
			case "if":
				return [
					...element.branches.flatMap(({ children }) => children),
					...(element.else ?? []),
				]
			case "each":
				return [...element.children, ...(element.else ?? [])]
			case "await":
				return [...element.then.children, ...(element.catch?.children ?? [])]
			case "await:catch":
				return element.catch.children
			case "key":
				return element.children
			case "expression":
			case "html":
				return []
			default:
				throw exhaustive(element)
		}
	}

	private setChildrenOfSelected(...children: Node[]) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i]
			child.parent = this.selected
			child.prev = children[i - 1]
			child.next = children.at(i + 1)
		}
	}
	//#endregion

	//#region navigation
	selectNextSibling() {
		const element = this.selected.element
		switch (element.type) {
			case "element":
			case "component":
			case "await:catch":
			case "key":
			case "expression":
			case "html":
				this.selected = this.selected.next ?? this.selected
				this.selectedPart = 0
				break
			case "if":
				if (element.branches.length - (element.else ? 0 : 1) > this.selectedPart)
					this.selectedPart++
				else {
					this.selected = this.selected.next ?? this.selected
					this.selectedPart = 0
				}
				break
			case "each":
				if (element.else && this.selectedPart == 0) this.selectedPart = 1
				else {
					this.selected = this.selected.next ?? this.selected
					this.selectedPart = 0
				}
				break
			case "await":
				// TODO: Fix
				this.selected = this.selected.next ?? this.selected
				this.selectedPart = 0
				break
			default:
				throw exhaustive(element)
		}
	}

	selectPrevSibling() {
		const element = this.selected.element
		const prev = () => {
			this.selected = this.selected.prev ?? this.selected
			const element = this.selected.prev?.element
			if (!element) return
			switch (element.type) {
				case "element":
				case "component":
				case "await:catch":
				case "key":
				case "expression":
				case "html":
					this.selectedPart = 0
					break
				case "if":
					this.selectedPart = element.branches.length - (element.else ? 0 : 1)
					break
				case "each":
					this.selectedPart = element.else ? 1 : 0
					break
				case "await":
					// TODO: Fix
					this.selectedPart = 0
					break
				default:
					throw exhaustive(element)
			}
		}
		switch (element.type) {
			case "element":
			case "component":
			case "await:catch":
			case "key":
			case "expression":
			case "html":
				prev()
				break
			case "if":
			case "each":
			case "await":
				if (this.selectedPart > 0) this.selectedPart--
				else prev()
				break
			default:
				throw exhaustive(element)
		}
	}

	selectParent() {
		if (!this.selected.parent) return
		const element = this.selected.element
		const parentEl = this.selected.parent.element
		switch (parentEl.type) {
			case "element":
			case "component":
			case "await:catch":
			case "key":
			case "expression":
			case "html":
				this.selectedPart = 0
				break
			case "if":
				const parts = parentEl.branches.map(({ children }) => children)
				if (parentEl.else) parts.push(parentEl.else)
				this.selectedPart = parts.findIndex(part =>
					part.find(node => node.element == element),
				)
				break
			case "each":
				this.selectedPart = parentEl.children.find(node => node.element == element) ? 0 : 1
				break
			case "await":
				// TODO: Fix
				this.selectedPart = 0
				break
			default:
				throw exhaustive(parentEl)
		}
		this.selected = this.selected.parent
	}

	selectFirstChild() {
		const element = this.selected.element
		this.selectedPart = 0
		switch (element.type) {
			case "element":
				this.selected = element.children.at(0) ?? this.selected
				break
			case "component":
				this.selected = element.children.at(0) ?? this.selected
				break
			case "if":
				this.selected = element.branches.at(0)?.children.at(0) ?? this.selected
				break
			case "each":
				this.selected = element.children.at(0) ?? this.selected
				break
			case "await":
				this.selected = element.then.children.at(0) ?? this.selected
				break
			case "await:catch":
				this.selected = element.catch.children.at(0) ?? this.selected
				break
			case "key":
				this.selected = element.children.at(0) ?? this.selected
				break
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(element)
		}
	}

	selectLastChild() {
		const element = this.selected.element
		this.selectedPart = 0
		switch (element.type) {
			case "element":
				this.selected = element.children.at(-1) ?? this.selected
				break
			case "component":
				this.selected = element.children.at(-1) ?? this.selected
				break
			case "if":
				this.selected =
					element.else?.at(-1) ??
					element.branches.at(-1)?.children.at(-1) ??
					this.selected
				break
			case "each":
				this.selected = element.else?.at(-1) ?? element.children.at(-1) ?? this.selected
				break
			case "await":
				this.selected =
					element.catch?.children.at(-1) ?? element.then.children.at(-1) ?? this.selected
				break
			case "await:catch":
				this.selected = element.catch.children.at(-1) ?? this.selected
				break
			case "key":
				this.selected = element.children.at(-1) ?? this.selected
				break
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(element)
		}
		const childEl = this.selected.element
		switch (childEl.type) {
			case "element":
			case "component":
			case "await:catch":
			case "key":
			case "expression":
			case "html":
				this.selectedPart = 0
				break
			case "if":
				this.selectedPart = childEl.branches.length - (childEl.else ? 0 : 1)
				break
			case "each":
				this.selectedPart = childEl.else ? 1 : 0
				break
			case "await":
				// TODO: Fix
				this.selectedPart = 0
				break
			default:
				throw exhaustive(childEl)
		}
	}
	//#endregion

	//#region replace
	replaceWithDOMElement(tagName: string, attributes: [string, string][] = []) {
		const element = this.selected.element
		const next: DOMElement = { type: "element", tagName, attributes, children: [] }
		next.children = this.collectChildren(element)
		this.selected.element = next
	}

	replaceWithComponent(name: string, src: string, properties: [string, any][] = []) {
		const element = this.selected.element
		const next: ComponentElement = { type: "component", name, src, properties, children: [] }
		next.children = this.collectChildren(element)
		this.selected.element = next
	}

	replaceWithIf(condition: string) {
		const element = this.selected.element
		const next: { children: Node[]; else?: Node[] } = { children: [] }
		switch (element.type) {
			case "element":
			case "component":
				next.children = element.children
				break
			case "each":
				next.children = element.children
				next.else = element.else
				break
			case "await":
				next.children = element.then.children
				next.else = element.catch?.children
				break
			case "await:catch":
				next.children = element.catch.children
				break
			case "key":
				next.children = element.children
				break
			case "if":
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(element)
		}
		this.selected.element = {
			type: "if",
			branches: [{ condition, children: next.children }],
			else: next.else,
		}
		this.setChildrenOfSelected(...next.children, ...(next.else ?? []))
	}

	replaceWithEach({
		expression,
		as,
		key,
		index,
	}: {
		expression: string
		as: string
		key?: string
		index?: string
	}) {
		const element = this.selected.element
		const next: { children: Node[]; else?: Node[] } = { children: [] }
		switch (element.type) {
			case "element":
			case "component":
				next.children = element.children
				break
			case "if":
				next.children = element.branches.flatMap(({ children }) => children)
				next.else = element.else
				break
			case "await":
				next.children = element.then.children
				next.else = element.catch?.children
				break
			case "await:catch":
				next.children = element.catch.children
				break
			case "key":
				next.children = element.children
				break
			case "each":
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(element)
		}
		this.selected.element = {
			type: "each",
			expression,
			as,
			key,
			index,
			children: next.children,
			else: next.else,
		}
		this.setChildrenOfSelected(...next.children, ...(next.else ?? []))
	}

	replaceWithAwait({
		expression,
		thenExpr,
		catchExpr,
	}: {
		expression: string
		thenExpr: string
		catchExpr?: string
	}) {
		const element = this.selected.element
		const next: { then: Node[]; catch?: Node[] } = { then: [] }
		switch (element.type) {
			case "element":
			case "component":
				next.then = element.children
				break
			case "if":
				next.then = element.branches.flatMap(({ children }) => children)
				next.catch = element.else
				break
			case "each":
				next.then = element.children
				next.catch = element.else
				break
			case "key":
				next.then = element.children
				break
			case "await":
			case "await:catch":
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(element)
		}
		this.selected.element = {
			type: "await",
			expression,
			then: { expression: thenExpr, children: next.then },
			catch: catchExpr ? { expression: catchExpr, children: next.catch ?? [] } : undefined,
		}
		this.setChildrenOfSelected(...next.then, ...(next.catch ?? []))
	}

	replaceWithKey(expression: string) {
		const children = this.collectChildren(this.selected.element)
		this.selected.element = { type: "key", expression, children }
		this.setChildrenOfSelected(...children)
	}

	replaceWithExpression({ expression, html = false }: { expression: string; html?: boolean }) {
		this.selected.element = { type: html ? "html" : "expression", expression }
	}
	//#endregion

	//#region insert
	appendChildElement(element: Element) {
		const node: Node = { element, parent: this.selected }
		const parentEl = this.selected.element
		switch (parentEl.type) {
			case "element":
			case "component":
			case "key":
				parentEl.children.push(node)
				break
			case "if":
				if (this.selectedPart == parentEl.branches.length && parentEl.else)
					parentEl.else.push(node)
				else parentEl.branches.at(this.selectedPart)?.children.push(node)
				break
			case "await":
				// TODO
				break
			case "await:catch":
				// TODO
				break
			case "each":
				if (this.selectedPart == 0) parentEl.children.push(node)
				else parentEl.else?.push(node)
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(parentEl)
		}
		this.setChildrenOfSelected(...this.collectChildren(parentEl))
	}

	prependChildElement(element: Element) {
		const node: Node = { element, parent: this.selected }
		const parentEl = this.selected.element
		switch (parentEl.type) {
			case "element":
			case "component":
			case "key":
				parentEl.children.unshift(node)
				break
			case "if":
				if (this.selectedPart == parentEl.branches.length && parentEl.else)
					parentEl.else.unshift(node)
				else parentEl.branches.at(this.selectedPart)?.children.unshift(node)
				break
			case "await":
				// TODO
				break
			case "await:catch":
				// TODO
				break
			case "each":
				if (this.selectedPart == 0) parentEl.children.unshift(node)
				else parentEl.else?.unshift(node)
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(parentEl)
		}
		this.setChildrenOfSelected(...this.collectChildren(parentEl))
	}

	insertElementBefore(element: Element) {
		if (!this.selected.parent) return
		const parent = this.selected.parent
		const node: Node = { element, parent }
		const parentEl = parent.element
		switch (parentEl.type) {
			case "element":
			case "component":
			case "key":
				const index = parentEl.children.indexOf(this.selected)
				parentEl.children.splice(index, 0, node)
				break
			case "if":
				{
					const part = parentEl.branches.at(this.selectedPart)?.children ?? parentEl.else
					if (part) {
						const index = part.indexOf(this.selected)
						part.splice(index, 0, node)
					}
				}
				break
			case "await":
				// TODO
				break
			case "await:catch":
				// TODO
				break
			case "each": {
				const part = this.selectedPart == 0 ? parentEl.children : parentEl.else
				if (part) {
					const index = part.indexOf(this.selected)
					part.splice(index, 0, node)
				}
			}
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(parentEl)
		}
		this.setChildrenOfSelected(...this.collectChildren(parentEl))
	}

	insertElementAfter(element: Element) {
		if (!this.selected.parent) return
		const parent = this.selected.parent
		const node: Node = { element, parent }
		const parentEl = parent.element
		switch (parentEl.type) {
			case "element":
			case "component":
			case "key":
				const index = parentEl.children.indexOf(this.selected)
				parentEl.children.splice(index + 1, 0, node)
				break
			case "if":
				{
					const part = parentEl.branches.at(this.selectedPart)?.children ?? parentEl.else
					if (part) {
						const index = part.indexOf(this.selected)
						part.splice(index + 1, 0, node)
					}
				}
				break
			case "await":
				// TODO
				break
			case "await:catch":
				// TODO
				break
			case "each": {
				const part = this.selectedPart == 0 ? parentEl.children : parentEl.else
				if (part) {
					const index = part.indexOf(this.selected)
					part.splice(index + 1, 0, node)
				}
			}
			case "expression":
			case "html":
				// noop
				break
			default:
				throw exhaustive(parentEl)
		}
		this.setChildrenOfSelected(...this.collectChildren(parentEl))
	}
	//#endregion

	//#region create
	createElement(
		props:
			| {
					type: "element"
					tagName: string
					attributes: [string, string][]
			  }
			| {
					type: "component"
					name: string
					src: string
					properties: [string, any][]
			  }
			| {
					type: "if"
					branches: string[]
					else?: boolean
			  }
			| {
					type: "each"
					expression: string
					as: string
					key?: string
					index?: string
					else?: boolean
			  }
			| {
					type: "key"
					expression: string
			  }
			| {
					type: "expression"
					expression: string
			  }
			| {
					type: "html"
					expression: string
			  },
	): Element {
		switch (props.type) {
			case "component":
			case "element":
			case "key":
				return { ...props, children: [] }
			case "if": {
				const { type, branches } = props
				return {
					type,
					branches: branches.map(condition => ({ condition, children: [] })),
					else: props.else ? [] : undefined,
				}
			}
			case "each": {
				const { type, expression, as, index, key } = props
				return {
					type,
					expression,
					as,
					index,
					key,
					children: [],
					else: props.else ? [] : undefined,
				}
			}
			case "expression":
			case "html":
				return { ...props }
			default:
				throw exhaustive(props)
		}
	}
	//#endregion

	//#region toString
	private node2string(node: Node, tabLevel = 0): string {
		const html = (nodes: Node[], tabLevel = 0) =>
			nodes.map(node => this.node2string(node, tabLevel)).join("")
		const tabs = (n: number) => "\t".repeat(n)
		const element = node.element
		switch (element.type) {
			case "element":
				const attributes =
					" ".repeat(element.attributes.length ? 1 : 0) +
					element.attributes.map(([k, v]) => `${k}="${v}"`).join(" ")
				return (
					`${tabs(tabLevel)}<${element.tagName}${attributes}` +
					(element.children.length
						? ">\n" +
						  html(element.children, tabLevel + 1) +
						  `${tabs(tabLevel)}</${element.tagName}>\n`
						: " />\n")
				)
			case "component":
				const properties = element.properties.map(([k, v]) => `${k}="${v}"`).join(" ")
				return (
					`${tabs(tabLevel)}<${element.name} ${properties}` +
					(element.children.length
						? ">\n" +
						  html(element.children, tabLevel + 1) +
						  `${tabs(tabLevel)}</${element.name}>\n`
						: " />\n")
				)
			case "key":
				return (
					`${tabs(tabLevel)}{#key ${element.expression}}\n` +
					html(element.children, tabLevel + 1) +
					`${tabs(tabLevel)}{/key}\n`
				)
			case "if":
				return (
					element.branches
						.map(({ condition, children }, i) => {
							if (i == 0)
								return (
									`${tabs(tabLevel)}{#if ${condition}}\n` +
									html(children, tabLevel + 1)
								)
							else
								return (
									`${tabs(tabLevel)}{:else if ${condition}}\n` +
									html(children, tabLevel + 1)
								)
						})
						.join("") +
					(element.else
						? `${tabs(tabLevel)}{:else}\n` + html(element.else, tabLevel + 1)
						: "") +
					`${tabs(tabLevel)}{/if}\n`
				)
			case "await":
				// TODO
				return ""
			case "await:catch":
				// TODO
				return ""
			case "each":
				const index = element.index ? ", " + element.index : ""
				const key = element.key ? `(${element.key})` : ""
				return (
					`${tabs(tabLevel)}{#each ${element.expression} as ${
						element.as
					} ${index} ${key}}\n` +
					html(element.children, tabLevel + 1) +
					(element.else
						? `${tabs(tabLevel)}{:else}\n` + html(element.else, tabLevel + 1)
						: "") +
					`${tabs(tabLevel)}{/each}\n`
				)
			case "expression":
				return `${tabs(tabLevel)}{${element.expression}}\n`
			case "html":
				return `${tabs(tabLevel)}{@html ${element.expression}}\n`
			default:
				throw exhaustive(element)
		}
	}

	toString() {
		return this.node2string(this.root)
	}
	//#endregion
}
