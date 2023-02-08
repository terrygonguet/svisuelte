export type Option<T> = T | undefined

export function isSome<T>(opt: Option<T>): opt is T {
	return opt != undefined
}

export function isNone<T>(opt: Option<T>): opt is undefined {
	return opt == undefined
}

export function map<T, U>(opt: Option<T>, f: (value: T) => U): Option<U> {
	return isSome(opt) ? f(opt) : undefined
}

export function flatMap<T, U>(opt: Option<T>, f: (value: T) => Option<U>): Option<U> {
	return isSome(opt) ? f(opt) : undefined
}

export function fromValue<T>(value: T | undefined | null): Option<T> {
	return value ?? undefined
}

export const None: Option<any> = undefined

export function Some<T>(value: T): Option<T> {
	return value
}
