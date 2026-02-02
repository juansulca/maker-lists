export type Item = {
	description: string;
	done: boolean;
};

export type List = {
	description: string;
	type: 'list' | 'checklist';
	done: boolean;
	items: Item[];
};
