import 'react';
import icons from '../components/icons';

declare module 'react' {
	interface CSSProperties {
		[ key: `--${ string }` ]: string | number;
	}
}

declare global {
	interface Window {
		newspack_dashboard: {
			quickActions: {
				href: string;
				title: string;
				icon: keyof typeof icons;
			}[];
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
		newspackSettings: {
			sections: Record<
				string,
				{
					label: string;
					path?: string;
				}
			>;
		};
		newspack_aux_data: {
			is_debug_mode: boolean;
		};
	}
}

export {};
