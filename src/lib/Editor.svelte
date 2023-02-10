<script context="module" lang="ts">
	export type EditorActionMap = typeof Action
	export type EditorAction = EditorActionMap[keyof EditorActionMap]
	export type Keybinds = { [key: string]: EditorAction }
	export const Action = {
		SelectNextSibling: "select.nextSibling",
		SelectPrevSibling: "select.prevSibling",
		SelectFirstChild: "select.firstChild",
		SelectLastChild: "select.lastChild",
		SelectParent: "select.parent",
		CreateSibling: "create.sibling",
		AppendChild: "create.child",
		ChangeElmentTag: "edit.tag",
	} as const
</script>

<script lang="ts">
	import { isNone, map, None, Some, type Option } from "$lib/option"
	import clamp from "just-clamp"
	import { onMount, tick } from "svelte"
	import { tweened } from "svelte/motion"
	import { Tree } from "$lib/tree"

	export let initialWidth: Option<number> = Some(800)
	export let initialHeight: Option<number> = Some(600)
	export let minWidth: Option<number> = None
	export let minHeight: Option<number> = None
	export let maxWidth: Option<number> = None
	export let maxHeight: Option<number> = None

	let wrapperWidth = 0
	let wrapperHeight = 0
	let width = initialWidth ?? 800
	let height = initialHeight ?? 600

	let content: HTMLDivElement
	const tree = new Tree()

	$: label = ""

	const spy = tweened<{ x: number; y: number; w: number; h: number }>(undefined, {
		duration: 100,
	})

	let cleanupResize: Option<() => void>
	function startResize(direction: "width" | "height" | "both") {
		function resize(e: PointerEvent) {
			switch (direction) {
				case "width":
					width = clamp(minWidth ?? 0, width + e.movementX, maxWidth ?? wrapperWidth)
					break
				case "height":
					height = clamp(minHeight ?? 0, height + e.movementY, maxHeight ?? wrapperHeight)
					break
				case "both":
					width = clamp(minWidth ?? 0, width + e.movementX, maxWidth ?? wrapperWidth)
					height = clamp(minHeight ?? 0, height + e.movementY, maxHeight ?? wrapperHeight)
					break
			}
		}

		return function () {
			window.addEventListener("pointermove", resize)
			cleanupResize = Some(() => {
				window.removeEventListener("pointermove", resize)
				cleanupResize = None
				updateSpybox()
			})
		}
	}

	function endResize() {
		cleanupResize?.()
	}

	function resetSize() {
		width = initialWidth ?? 800
		height = initialHeight ?? 600
		tick().then(updateSpybox)
	}

	function elementLabel(el: Element) {
		const hasId = !!el.id
		const hasClasses = !!el.className
		return (
			el.tagName.toLowerCase() +
			(hasId ? "#" + el.id : "") +
			(hasClasses ? "." + Array.from(el.classList).join(".") : "")
		)
	}

	let editorEl: Element
	function updateSpybox() {
		// if (isNone(selected)) return
		// const wrapper = editorEl.getBoundingClientRect()
		// const rect = selected.getBoundingClientRect()
		// $spy = {
		// 	x: rect.x - wrapper.x,
		// 	y: rect.y - wrapper.y,
		// 	w: rect.width,
		// 	h: rect.height,
		// }
	}

	export function executeAction(action: EditorAction) {}

	onMount(() => {
		tree.appendChildElement(
			tree.createElement({
				type: "element",
				tagName: "div",
				attributes: [
					["id", "div1"],
					["style", "background:red"],
				],
			}),
		)
		tree.appendChildElement(
			tree.createElement({
				type: "if",
				branches: ["condition == 1", "condition == 2"],
				else: true,
			}),
		)
		tree.selectFirstChild()
		tree.selectNextSibling()
		tree.appendChildElement(
			tree.createElement({
				type: "element",
				tagName: "div",
				attributes: [["id", "div2"]],
			}),
		)
		tree.selectNextSibling()
		tree.appendChildElement(
			tree.createElement({
				type: "element",
				tagName: "div",
				attributes: [["id", "div3"]],
			}),
		)
		tree.selectNextSibling()
		tree.appendChildElement(
			tree.createElement({
				type: "element",
				tagName: "div",
				attributes: [["id", "div4"]],
			}),
		)
		tree.insertElementAfter(
			tree.createElement({
				type: "each",
				expression: "items",
				as: "item",
				key: "item.id",
				index: "i",
				else: true,
			}),
		)
		tree.selectNextSibling()
		tree.appendChildElement(
			tree.createElement({
				type: "component",
				name: "Card",
				src: "$lib/Card.svelte",
				properties: [["item", "{item}"]],
			}),
		)
		tree.selectNextSibling()
		tree.appendChildElement(
			tree.createElement({
				type: "element",
				tagName: "p",
				attributes: [],
			}),
		)
		tree.selectNextSibling()
		// tree.replaceWithExpression({ expression: "message", html: true })
		console.log(tree.toString())
	})
</script>

<svelte:window on:pointerup={endResize} />

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<section
	id="wrapper"
	bind:clientWidth={wrapperWidth}
	bind:clientHeight={wrapperHeight}
	on:keydown
	on:keyup
	tabindex="0"
>
	<div id="editor" bind:this={editorEl}>
		<span id="dimensions" on:dblclick={resetSize}>{width}x{height}px - {label}</span>
		<!-- {#if selected}
			<div
				id="spy"
				style:--x={$spy.x}
				style:--y={$spy.y}
				style:--w={$spy.w}
				style:--h={$spy.h}
				class:faded={cleanupResize}
			/>
		{/if} -->
		<div
			id="content"
			style:width={width + "px"}
			style:height={height + "px"}
			bind:this={content}
		/>
		<button tabindex="-1" id="width-handle" on:pointerdown={startResize("width")}>║</button>
		<button tabindex="-1" id="height-handle" on:pointerdown={startResize("height")}>══</button>
		<button tabindex="-1" id="both-handle" on:pointerdown={startResize("both")} />
	</div>
</section>

<style>
	#wrapper {
		height: 100%;
		display: grid;
		place-items: center;
		overflow: hidden;
	}

	#editor {
		position: relative;
		display: grid;
		gap: 2px;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		grid-template-areas:
			"content       width-handle"
			"height-handle both-handle";
	}

	#content {
		border: 1px solid gray;
		grid-area: content;
		overflow: hidden;
		display: grid;
	}

	button {
		all: initial;
		display: flex;
		justify-content: center;
		align-items: center;
		background: gray;
		color: white;
		user-select: none;
	}
	#width-handle {
		grid-area: width-handle;
		cursor: col-resize;
		width: 1rem;
	}
	#height-handle {
		grid-area: height-handle;
		cursor: row-resize;
		height: 1rem;
	}
	#both-handle {
		grid-area: both-handle;
		cursor: move;
	}

	#spy {
		position: absolute;
		top: calc(var(--y) * 1px);
		left: calc(var(--x) * 1px);
		width: calc(var(--w) * 1px);
		height: calc(var(--h) * 1px);
		outline: 2px solid black;
		outline-offset: 5px;
		z-index: 100;
		font-family: "Courier New", Courier, monospace;
		pointer-events: none;
		transition: opacity 0.2s ease-in-out;
		opacity: 0.2;
	}
	#wrapper:focus #spy {
		opacity: 1;
	}
	#spy.faded {
		opacity: 0.2;
	}

	#dimensions {
		position: absolute;
		left: 0;
		top: -0.5rem;
		translate: 0 -100%;
		user-select: none;
		font-family: "Courier New", Courier, monospace;
		max-width: 100%;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}
</style>
