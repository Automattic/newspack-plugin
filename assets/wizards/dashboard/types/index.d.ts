import icons from '../components/icons';

export {};

declare global {
	interface Window {
		newspack_dashboard: {
			siteActions: {
				readerActivation: ActionLocal;
				googleAnalytics: ActionLocal;
				googleAdManager: ActionLocal & {
					isAvailable: boolean;
				};
			};
			sections: {
				[ k: string ]: {
					title: string;
					desc: string;
					cards: { href: string; title: string; desc: string; icon: keyof typeof icons }[];
				};
			};
			settings: {
				siteName: string;
				headerBgColor: string;
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
