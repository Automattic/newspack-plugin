/**
 * Rolling Content demo — type definitions.
 */

declare global {
	type RollingContentStatus = 'active' | 'archived' | 'scheduled';
	type EntryStatus = 'published' | 'draft' | 'scheduled';

	interface Entry {
		id: number;
		title: string;
		date: string;
		author: string;
		featuredImage: string;
		status: EntryStatus;
		tags: string[];
	}

	interface RollingContent {
		id: number;
		title: string;
		date: string;
		featuredImage: string;
		status: RollingContentStatus;
		entries: Entry[];
	}
}

export {};
