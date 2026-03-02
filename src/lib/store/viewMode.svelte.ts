let viewMode = $state<'list' | 'checklist'>('list');

export function getViewMode() {
	return viewMode;
}

export function setViewMode(mode: 'list' | 'checklist') {
	viewMode = mode;
}

export function toggleViewMode() {
	viewMode = viewMode === 'list' ? 'checklist' : 'list';
}
