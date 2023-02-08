export type Option<T> = T | null

export function isSome<T>(opt: Option<T>): opt is T {
	return opt != null
}

export function isNone<T>(opt: Option<T>): opt is null {
	return opt == null
}

export function map<T, U>(opt: Option<T>, f: (value: T) => U): Option<U> {
	return isSome(opt) ? f(opt) : null
}

export function flatMap<T, U>(opt: Option<T>, f: (value: T) => Option<U>): Option<U> {
	return isSome(opt) ? f(opt) : null
}

export function fromValue<T>(value: T | null): Option<T> {
	return value ?? null
}

export const None: Option<any> = null

export function Some<T>(value: T): Option<T> {
	return value
}
