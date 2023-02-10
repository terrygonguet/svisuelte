<script lang="ts">
	import Editor, { Action, type Keybinds } from "$lib/Editor.svelte"

	let editor: Editor

	const keybinds: Keybinds = {
		ArrowUp: Action.SelectPrevSibling,
		ArrowDown: Action.SelectNextSibling,
		ArrowLeft: Action.SelectParent,
		ArrowRight: Action.SelectFirstChild,
		c: Action.AppendChild,
		s: Action.CreateSibling,
		t: Action.ChangeElmentTag,
	}

	function handleKeydown(e: KeyboardEvent) {
		const action = keybinds[e.key]
		editor.executeAction(action)
	}
</script>

<Editor bind:this={editor} on:keydown={handleKeydown} initialWidth={800} initialHeight={600} />
