import { describe, it, expect, beforeEach } from 'vitest';
import {
	textToMorse,
	morseToText,
	getEntryByChar,
	getEntryByCode,
	buildMorseBinaryTree,
	MORSE_ALPHABET,
	MORSE_NUMBERS,
	ALL_MORSE,
	type BinaryTreeNode,
} from '$lib/morse';

describe('textToMorse', () => {
	it('converts a single letter', () => {
		expect(textToMorse('A')).toBe('.-');
		expect(textToMorse('E')).toBe('.');
		expect(textToMorse('T')).toBe('-');
	});

	it('converts lowercase to morse', () => {
		expect(textToMorse('sos')).toBe('... --- ...');
	});

	it('converts a word', () => {
		expect(textToMorse('HI')).toBe('.... ..');
	});

	it('handles spaces between words', () => {
		expect(textToMorse('HI THERE')).toBe('.... .. / - .... . .-. .');
	});

	it('converts numbers', () => {
		expect(textToMorse('123')).toBe('.---- ..--- ...--');
	});

	it('skips unknown characters', () => {
		expect(textToMorse('A!B')).toBe('.- -...');
	});
});

describe('morseToText', () => {
	it('converts morse to a single letter', () => {
		expect(morseToText('.-')).toBe('A');
	});

	it('converts morse words', () => {
		expect(morseToText('.... ..')).toBe('HI');
	});

	it('handles word separators', () => {
		expect(morseToText('.... .. / - .... . .-. .')).toBe('HI THERE');
	});

	it('marks unknown codes with ?', () => {
		expect(morseToText('........')).toBe('?');
	});

	it('round-trips text correctly', () => {
		const original = 'HELLO WORLD';
		expect(morseToText(textToMorse(original))).toBe(original);
	});

	it('round-trips numbers', () => {
		const original = '1234567890';
		expect(morseToText(textToMorse(original))).toBe(original);
	});
});

describe('getEntryByChar', () => {
	it('finds an entry by character', () => {
		const entry = getEntryByChar('S');
		expect(entry).toBeDefined();
		expect(entry!.code).toBe('...');
		expect(entry!.mnemonic).toBe('si-si-si');
	});

	it('is case insensitive', () => {
		expect(getEntryByChar('s')).toBeDefined();
		expect(getEntryByChar('s')!.code).toBe('...');
	});

	it('returns undefined for unknown chars', () => {
		expect(getEntryByChar('!')).toBeUndefined();
	});
});

describe('getEntryByCode', () => {
	it('finds an entry by morse code', () => {
		const entry = getEntryByCode('...');
		expect(entry).toBeDefined();
		expect(entry!.char).toBe('S');
	});

	it('returns undefined for unknown codes', () => {
		expect(getEntryByCode('........')).toBeUndefined();
	});
});

describe('MORSE_ALPHABET', () => {
	it('has 26 entries', () => {
		expect(MORSE_ALPHABET).toHaveLength(26);
	});

	it('has unique codes', () => {
		const codes = MORSE_ALPHABET.map((e) => e.code);
		expect(new Set(codes).size).toBe(26);
	});

	it('has unique characters', () => {
		const chars = MORSE_ALPHABET.map((e) => e.char);
		expect(new Set(chars).size).toBe(26);
	});
});

describe('MORSE_NUMBERS', () => {
	it('has 10 entries', () => {
		expect(MORSE_NUMBERS).toHaveLength(10);
	});
});

describe('ALL_MORSE', () => {
	it('has 36 entries total', () => {
		expect(ALL_MORSE).toHaveLength(36);
	});
});

describe('buildMorseBinaryTree', () => {
	let tree: BinaryTreeNode;

	beforeEach(() => {
		tree = buildMorseBinaryTree();
	});

	it('has E at the first dot position', () => {
		expect(tree.dot?.char).toBe('E');
	});

	it('has T at the first dash position', () => {
		expect(tree.dash?.char).toBe('T');
	});

	it('has I at dot-dot', () => {
		expect(tree.dot?.dot?.char).toBe('I');
	});

	it('has A at dot-dash', () => {
		expect(tree.dot?.dash?.char).toBe('A');
	});

	it('has N at dash-dot', () => {
		expect(tree.dash?.dot?.char).toBe('N');
	});

	it('has M at dash-dash', () => {
		expect(tree.dash?.dash?.char).toBe('M');
	});

	it('has S at dot-dot-dot', () => {
		expect(tree.dot?.dot?.dot?.char).toBe('S');
	});

	it('has O at dash-dash-dash', () => {
		expect(tree.dash?.dash?.dash?.char).toBe('O');
	});

	it('contains all 36 characters', () => {
		const chars: string[] = [];
		function collect(node: BinaryTreeNode | undefined) {
			if (!node) return;
			if (node.char) chars.push(node.char);
			collect(node.dot);
			collect(node.dash);
		}
		collect(tree);
		expect(chars).toHaveLength(36);
	});

	it('can navigate to any letter by its code', () => {
		for (const entry of ALL_MORSE) {
			let node: BinaryTreeNode | undefined = tree;
			for (const symbol of entry.code) {
				node = symbol === '.' ? node?.dot : node?.dash;
			}
			expect(node?.char).toBe(entry.char);
		}
	});
});
