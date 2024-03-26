import icons from '../components/icons';

export {};

declare global {
	interface Window {
		newspack_dashboard: {
			sections: {
				[ k: string ]: {
					title: string;
					desc: string;
					cards: { href: string; title: string; desc: string; icon: keyof typeof icons }[];
				};
			};
		};
		newspack_aux_data: {
			is_debug_mode: boolean;
		};
	}
}

import 'react';

declare module 'react' {
	interface CSSProperties {
		[ key: `--${ string }` ]: string | number;
	}
}