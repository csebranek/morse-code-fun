export type MorseSymbol = '.' | '-';
export type MorseCode = string; // e.g. ".-"

export interface MorseEntry {
	char: string;
	code: MorseCode;
	mnemonic: string;
	mnemonicStressed: string; // capitalized syllables = dashes
}

export const MORSE_ALPHABET: MorseEntry[] = [
	{ char: 'A', code: '.-', mnemonic: 'a-PART', mnemonicStressed: 'a PART' },
	{ char: 'B', code: '-...', mnemonic: 'BOB-is-the-man', mnemonicStressed: 'BOB is the man' },
	{ char: 'C', code: '-.-.', mnemonic: 'CO-ca-CO-la', mnemonicStressed: 'CO ca CO la' },
	{ char: 'D', code: '-..', mnemonic: 'DOG-did-it', mnemonicStressed: 'DOG did it' },
	{ char: 'E', code: '.', mnemonic: 'eh?', mnemonicStressed: 'eh' },
	{ char: 'F', code: '..-.', mnemonic: 'fetch-a-FIRE-man', mnemonicStressed: 'fetch a FIRE man' },
	{ char: 'G', code: '--.', mnemonic: 'GOOD-GRAV-y', mnemonicStressed: 'GOOD GRAV y' },
	{ char: 'H', code: '....', mnemonic: 'hip-i-ty-hop', mnemonicStressed: 'hip i ty hop' },
	{ char: 'I', code: '..', mnemonic: 'i-bid', mnemonicStressed: 'i bid' },
	{ char: 'J', code: '.---', mnemonic: 'in-JAWS-JAWS-JAWS', mnemonicStressed: 'in JAWS JAWS JAWS' },
	{ char: 'K', code: '-.-', mnemonic: 'KANG-a-ROO', mnemonicStressed: 'KANG a ROO' },
	{ char: 'L', code: '.-..', mnemonic: 'los-AN-ge-les', mnemonicStressed: 'los AN ge les' },
	{ char: 'M', code: '--', mnemonic: 'MMMM-MMMM', mnemonicStressed: 'MMMM MMMM' },
	{ char: 'N', code: '-.', mnemonic: 'NU-dist', mnemonicStressed: 'NU dist' },
	{ char: 'O', code: '---', mnemonic: 'OH-MY-GOD', mnemonicStressed: 'OH MY GOD' },
	{ char: 'P', code: '.--.', mnemonic: 'a-POOP-Y-smell', mnemonicStressed: 'a POOP Y smell' },
	{ char: 'Q', code: '--.-', mnemonic: 'GOD-SAVE-the-QUEEN', mnemonicStressed: 'GOD SAVE the QUEEN' },
	{ char: 'R', code: '.-.', mnemonic: 'ro-TAT-ion', mnemonicStressed: 'ro TAT ion' },
	{ char: 'S', code: '...', mnemonic: 'si-si-si', mnemonicStressed: 'si si si' },
	{ char: 'T', code: '-', mnemonic: 'TALL', mnemonicStressed: 'TALL' },
	{ char: 'U', code: '..-', mnemonic: 'u-ni-FORM', mnemonicStressed: 'u ni FORM' },
	{ char: 'V', code: '...-', mnemonic: 'vic-tor-y-VEE', mnemonicStressed: 'vic tor y VEE' },
	{ char: 'W', code: '.--', mnemonic: 'the-WORLD-WAR', mnemonicStressed: 'the WORLD WAR' },
	{ char: 'X', code: '-..-', mnemonic: 'X-marks-the-SPOT', mnemonicStressed: 'X marks the SPOT' },
	{ char: 'Y', code: '-.--', mnemonic: "YOU'RE-a-COOL-DUDE", mnemonicStressed: "YOU'RE a COOL DUDE" },
	{ char: 'Z', code: '--..', mnemonic: 'ZINC-ZOO-kee-per', mnemonicStressed: 'ZINC ZOO kee per' },
];

export const MORSE_NUMBERS: MorseEntry[] = [
	{ char: '1', code: '.----', mnemonic: '1', mnemonicStressed: '1' },
	{ char: '2', code: '..---', mnemonic: '2', mnemonicStressed: '2' },
	{ char: '3', code: '...--', mnemonic: '3', mnemonicStressed: '3' },
	{ char: '4', code: '....-', mnemonic: '4', mnemonicStressed: '4' },
	{ char: '5', code: '.....', mnemonic: '5', mnemonicStressed: '5' },
	{ char: '6', code: '-....', mnemonic: '6', mnemonicStressed: '6' },
	{ char: '7', code: '--...', mnemonic: '7', mnemonicStressed: '7' },
	{ char: '8', code: '---..', mnemonic: '8', mnemonicStressed: '8' },
	{ char: '9', code: '----.', mnemonic: '9', mnemonicStressed: '9' },
	{ char: '0', code: '-----', mnemonic: '0', mnemonicStressed: '0' },
];

export const ALL_MORSE: MorseEntry[] = [...MORSE_ALPHABET, ...MORSE_NUMBERS];

// Lookup maps
const charToCode = new Map<string, string>();
const codeToChar = new Map<string, string>();
for (const entry of ALL_MORSE) {
	charToCode.set(entry.char, entry.code);
	codeToChar.set(entry.code, entry.char);
}

export function textToMorse(text: string): string {
	return text
		.toUpperCase()
		.split('')
		.map((ch) => {
			if (ch === ' ') return '/';
			return charToCode.get(ch) ?? '';
		})
		.filter(Boolean)
		.join(' ');
}

export function morseToText(morse: string): string {
	return morse
		.split(' / ')
		.map((word) =>
			word
				.split(' ')
				.map((code) => codeToChar.get(code) ?? '?')
				.join('')
		)
		.join(' ');
}

export function getEntryByChar(char: string): MorseEntry | undefined {
	return ALL_MORSE.find((e) => e.char === char.toUpperCase());
}

export function getEntryByCode(code: string): MorseEntry | undefined {
	return ALL_MORSE.find((e) => e.code === code);
}

// Binary tree structure for the dichotomous search method
export interface BinaryTreeNode {
	char: string | null;
	dot?: BinaryTreeNode;
	dash?: BinaryTreeNode;
}

export function buildMorseBinaryTree(): BinaryTreeNode {
	const root: BinaryTreeNode = { char: null };

	for (const entry of ALL_MORSE) {
		let node = root;
		for (const symbol of entry.code) {
			if (symbol === '.') {
				if (!node.dot) node.dot = { char: null };
				node = node.dot;
			} else {
				if (!node.dash) node.dash = { char: null };
				node = node.dash;
			}
		}
		node.char = entry.char;
	}

	return root;
}

// The E.T. Ian story order for building the tree (frequency order)
export const BINARY_TREE_ORDER = [
	'E', 'T',
	'I', 'A', 'N', 'M',
	'S', 'U', 'R', 'W', 'D', 'K', 'G', 'O',
	'H', 'V', 'F', '', 'L', '', 'P', 'J', 'B', 'X', 'C', 'Y', 'Z', 'Q', '', '',
];

// Timing constants (in units, where 1 unit = dot duration)
export const TIMING = {
	DOT: 1,
	DASH: 3,
	INTRA_CHAR_GAP: 1, // between parts of the same letter
	INTER_CHAR_GAP: 3, // between letters
	WORD_GAP: 7,       // between words
} as const;
