<script lang="ts">
	import { isNone, map, None, Some, type Option } from "$lib/option"
	import clamp from "just-clamp"
	import { onMount, tick } from "svelte"
	import { tweened } from "svelte/motion"

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
	let selected: Option<Element>

	$: label = selected ? elementLabel(selected) : ""

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
		if (isNone(selected)) return
		const wrapper = editorEl.getBoundingClientRect()
		const rect = selected.getBoundingClientRect()
		$spy = {
			x: rect.x - wrapper.x,
			y: rect.y - wrapper.y,
			w: rect.width,
			h: rect.height,
		}
	}

	function select(el: Element) {
		selected = el
		updateSpybox()
	}

	onMount(() => {
		content.innerHTML =
			"<div><p>Proident fugiat non culpa excepteur. Fugiat do quis cupidatat reprehenderit dolor ex. Laborum enim tempor nulla duis ipsum sint excepteur laboris pariatur. Ipsum mollit dolore qui dolor. Consectetur commodo aliqua veniam est commodo velit. Id eu proident laboris veniam id mollit officia do occaecat laborum minim mollit.</p><p>Consectetur ex ex qui ex adipisicing exercitation ipsum eiusmod id occaecat. Ad occaecat non incididunt et ea exercitation duis sint deserunt. Consectetur Lorem mollit anim sint aliquip exercitation. Veniam veniam laboris nostrud consectetur nulla. Non nulla enim ut sunt in aliqua cillum ex ad laborum proident id laborum. Sit laborum cillum enim reprehenderit ex eu velit incididunt in ut enim ut.</p></div>"
		select(content.children[0])
	})
</script>

<svelte:window on:pointerup={endResize} />

<section id="wrapper" bind:clientWidth={wrapperWidth} bind:clientHeight={wrapperHeight}>
	<div id="editor" bind:this={editorEl}>
		<span id="dimensions" on:dblclick={resetSize}>{width}x{height}px - {label}</span>
		{#if selected}
			<div
				id="spy"
				style:--x={$spy.x}
				style:--y={$spy.y}
				style:--w={$spy.w}
				style:--h={$spy.h}
				style:opacity={cleanupResize ? 0.2 : 1}
			/>
		{/if}
		<div
			id="content"
			style:width={width + "px"}
			style:height={height + "px"}
			bind:this={content}
		/>
		<button id="width-handle" on:pointerdown={startResize("width")}>║</button>
		<button id="height-handle" on:pointerdown={startResize("height")}>══</button>
		<button id="both-handle" on:pointerdown={startResize("both")} />
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
