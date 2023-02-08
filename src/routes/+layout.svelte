<slot />

<style global>
	:global(body, html, #app) {
		height: 100%;
		padding: 0;
		margin: 0;
		font-family: Arial, Helvetica, sans-serif;
	}

	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}
</style>
