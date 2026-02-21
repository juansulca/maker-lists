export type Item = {
	id: string;
	description: string;
	done: boolean;
};

export type List = {
	id: string;
	description: string;
	type: 'list' | 'checklist';
	done: boolean;
	items: Item[];
};
