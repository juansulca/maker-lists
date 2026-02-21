const DEFAULT_DRAGGING_CLASS = 'dragging';

interface DraggableOptions<T> {
	dragData?: T;
	container: string;
	disabled?: boolean;
}

export function draggable<T>(node: HTMLElement, options: DraggableOptions<T>) {
	const draggingClass = DEFAULT_DRAGGING_CLASS.split(' ');

	node.draggable = true;
	node.style.cursor = 'grab';

	function handleDragStart(event: DragEvent) {
		if (options.disabled) return;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', JSON.stringify(options.dragData));
		}
		node.classList.add(...draggingClass);

		const customEvent = new CustomEvent('dragstart-on-container', { bubbles: true });
		node.dispatchEvent(customEvent);
	}

	function handleDragEnd() {
		node.classList.remove(...draggingClass);
	}

	node.draggable = !options.disabled;
	node.addEventListener('dragstart', handleDragStart);
	node.addEventListener('dragend', handleDragEnd);

	return {
		update(newOptions: DraggableOptions<T>) {
			options = newOptions;
			node.draggable = !options.disabled;
		},

		destroy() {
			node.addEventListener('dragstart', handleDragStart);
			node.addEventListener('dragend', handleDragEnd);
		}
	};
}
