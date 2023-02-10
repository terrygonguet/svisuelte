export function exhaustive(never: never) {
	return new Error("This switch statement is not exhaustive")
}
