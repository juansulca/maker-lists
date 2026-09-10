import type { Attachment } from 'svelte/attachments';
import { tick } from 'svelte';
import { begin, cancel, dnd, drop, moveOver, overAt, setOver, type Active, type Direction } from './state.svelte';

export type DraggableOptions<T = unknown> = {
	id: string;
	data?: T;
	disabled?: boolean;
	/** Selector for descendants that must not start a pointer drag. */
	interactive?: string;
};

const INTERACTIVE = 'input, textarea, select, button, a, [contenteditable]';
const ARROWS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
const TOUCH_HOLD_MS = 200;

/**
 * Makes an element draggable with the pointer (mouse/touch/pen) and the keyboard
 * (Space/Enter to pick up, arrows to move, Space/Enter to drop, Escape to cancel).
 * Sets `data-dragging` on the element while it is being dragged.
 */
export function draggable<T = unknown>(options: DraggableOptions<T>): Attachment<HTMLElement> {
	return (node) => {
		node.dataset.dndDraggable = options.id;
		if (!node.hasAttribute('tabindex')) node.tabIndex = 0;
		node.setAttribute('aria-roledescription', 'draggable');

		const active = (): Active<T> => ({ id: options.id, data: options.data as T });

		// ----- pointer -----
		let start: { x: number; y: number; touch: boolean } | null = null;
		let dragging = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let savedStyle = '';

		function onPointerDown(e: PointerEvent) {
			if (options.disabled || dnd.active || e.button !== 0) return;
			const target = e.target as Element;
			if (target.closest('[data-dnd-draggable]') !== node) return; // nested draggable owns this event
			if (target.closest(options.interactive ?? INTERACTIVE)) return;
			start = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' };
			if (start.touch) timer = setTimeout(activate, TOUCH_HOLD_MS);
			window.addEventListener('pointermove', onPointerMove);
			window.addEventListener('pointerup', onPointerUp);
			window.addEventListener('pointercancel', abort);
			window.addEventListener('keydown', onWindowKeyDown);
			window.addEventListener('touchmove', onTouchMove, { passive: false });
			node.addEventListener('contextmenu', preventDefault);
		}

		function activate() {
			if (!start || dragging) return;
			dragging = true;
			savedStyle = node.style.cssText;
			if (getComputedStyle(node).position === 'static') node.style.position = 'relative';
			node.style.zIndex = '1000';
			node.style.pointerEvents = 'none';
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'grabbing';
			begin(node, active(), 'pointer');
		}

		function onPointerMove(e: PointerEvent) {
			if (!start) return;
			const dx = e.clientX - start.x;
			const dy = e.clientY - start.y;
			if (!dragging) {
				if (Math.hypot(dx, dy) < 4) return;
				if (start.touch) return abort(); // moved before the hold elapsed: let the page scroll
				activate();
			}
			node.style.transform = `translate(${dx}px, ${dy}px)`;
			setOver(overAt(e.clientX, e.clientY));
		}

		function onPointerUp() {
			if (dragging) {
				drop();
				suppressNextClick();
			}
			finish();
		}

		function abort() {
			if (dragging) cancel();
			finish();
		}

		function finish() {
			clearTimeout(timer);
			start = null;
			if (dragging) {
				node.style.cssText = savedStyle;
				document.body.style.userSelect = '';
				document.body.style.cursor = '';
			}
			dragging = false;
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', abort);
			window.removeEventListener('keydown', onWindowKeyDown);
			window.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('contextmenu', preventDefault);
		}

		function onWindowKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') abort();
		}

		function onTouchMove(e: TouchEvent) {
			if (dragging) e.preventDefault();
		}

		// ----- keyboard -----
		function isKeyboardActive() {
			return dnd.mode === 'keyboard' && dnd.active?.id === options.id;
		}

		function onKeyDown(e: KeyboardEvent) {
			if (e.target !== node || options.disabled) return;
			const pick = e.key === ' ' || e.key === 'Enter';
			if (!dnd.active) {
				if (!pick) return;
				e.preventDefault();
				begin(node, active(), 'keyboard');
				return;
			}
			if (!isKeyboardActive()) return;
			if (ARROWS[e.key]) {
				e.preventDefault();
				moveOver(ARROWS[e.key]);
			} else if (pick) {
				e.preventDefault();
				drop();
				tick().then(() => document.querySelector<HTMLElement>(`[data-dnd-draggable="${options.id}"]`)?.focus());
			} else if (e.key === 'Escape') {
				e.preventDefault();
				cancel();
			}
		}

		function onBlur() {
			if (isKeyboardActive()) cancel();
		}

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('keydown', onKeyDown);
		node.addEventListener('blur', onBlur);

		return () => {
			abort();
			if (isKeyboardActive()) cancel();
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('keydown', onKeyDown);
			node.removeEventListener('blur', onBlur);
			delete node.dataset.dndDraggable;
		};
	};
}

function preventDefault(e: Event) {
	e.preventDefault();
}

/** The click that follows a completed pointer drag must not reach the dragged element's children. */
function suppressNextClick() {
	const stop = (e: Event) => {
		e.stopPropagation();
		e.preventDefault();
	};
	window.addEventListener('click', stop, { capture: true, once: true });
	setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
}
