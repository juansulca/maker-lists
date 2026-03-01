const adjectives: string[] = [
	'sweet',
	'spicy',
	'tiny',
	'happy',
	'fuzzy',
	'brave',
	'sleepy',
	'shiny',
	'bouncy',
	'gentle',
	'silly',
	'clever',
	'zesty',
	'cozy',
	'swift',
	'bright',
	'mighty',
	'curious',
	'lucky',
	'witty'
];

const nouns: string[] = [
	'pickle',
	'otter',
	'mango',
	'rocket',
	'pancake',
	'badger',
	'cactus',
	'dragon',
	'falcon',
	'ginger',
	'harbor',
	'island',
	'jelly',
	'koala',
	'lantern',
	'meadow',
	'noodle',
	'pepper',
	'quokka',
	'turtle'
];

function randomItem<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

export function generateRandomName(): string {
	const adjective = randomItem(adjectives);
	const noun = randomItem(nouns);
	return `${adjective} ${noun}`;
}
