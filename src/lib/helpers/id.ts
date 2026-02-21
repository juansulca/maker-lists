import { nanoid } from 'nanoid';

export function newId() {
	return nanoid(8);
}

export function newItemId() {
	return nanoid(6);
}
