<script lang="ts">
	import { None, Some, type Option } from "$lib/option"
	import clamp from "just-clamp"

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
	let cleanup: Option<() => void>

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
			cleanup = Some(() => {
				window.removeEventListener("pointermove", resize)
				cleanup = None
			})
		}
	}

	function endResize() {
		cleanup?.()
	}

	function resetSize() {
		width = initialWidth ?? 800
		height = initialHeight ?? 600
	}
</script>

<svelte:window on:pointerup={endResize} />

<section id="wrapper" bind:clientWidth={wrapperWidth} bind:clientHeight={wrapperHeight}>
	<div id="editor">
		<span id="dimensions" on:dblclick={resetSize}>{width}x{height}px</span>
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

	#dimensions {
		position: absolute;
		left: 0;
		top: -0.5rem;
		translate: 0 -100%;
		user-select: none;
	}
</style>
