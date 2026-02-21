const DRAG_OVER_CLASS = 'droppable';

interface DroppableOptions<T> {
	dragData?: T;
	container: string;
	disabled?: boolean;
	onDrop?: (data: T) => void;
}

export function droppable<T>(node: HTMLElement, options: DroppableOptions<T>) {
	const dragOverClass = DRAG_OVER_CLASS.split(' ');

	function handleDragEnter(event: DragEvent) {
		if (options.disabled) return;

		event.preventDefault();

		node.classList.add(...dragOverClass);
	}

	function handleDragLeave(_event: DragEvent) {
		if (options.disabled) return;

		node.classList.remove(...dragOverClass);
	}

	function handleDragOver(event: DragEvent) {
		if (options.disabled) return;
		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(event: DragEvent) {
		if (options.disabled) return;
		event.preventDefault();

		node.classList.remove(...dragOverClass);
		if (event.dataTransfer) {
			const dragData = JSON.parse(event.dataTransfer.getData('text/plain')) as T;
			// dndState.draggedItem = dragData;
			options.onDrop?.(dragData);
		}
	}

	function handleDragStartOnContainer(event: Event) {
		if (options.disabled) return;

		node.classList.remove(...dragOverClass);
	}

	function handlePointerOver(event: PointerEvent) {
		if (options.disabled) return;

		node.classList.add(...dragOverClass);
	}

	function handlePointerOut(event: PointerEvent) {
		if (options.disabled) return;

		node.classList.remove(...dragOverClass);
	}

	function handlePointerUp(event: PointerEvent) {
		if (options.disabled) return;

		node.classList.remove(...dragOverClass);
	}

	node.addEventListener('dragenter', handleDragEnter);
	node.addEventListener('dragleave', handleDragLeave);
	node.addEventListener('dragover', handleDragOver);
	node.addEventListener('drop', handleDrop);

	return {
		update(newOptions: DroppableOptions<T>) {
			options = newOptions;
		},

		destroy() {
			node.removeEventListener('dragenter', handleDragEnter);
			node.removeEventListener('dragleave', handleDragLeave);
			node.removeEventListener('dragover', handleDragOver);
			node.removeEventListener('drop', handleDrop);
		}
	};
}
