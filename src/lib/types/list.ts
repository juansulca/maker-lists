export type Node = {
	id: string;
	description: string;
	done: boolean;
	parentId: string | null;
	order: number;
	type: 'list' | 'checklist';
};
