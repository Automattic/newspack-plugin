import 'react';
import icons from '../components/icons';

declare module 'react' {
	interface CSSProperties {
		[ key: `--${ string }` ]: string | number;
	}
}

declare global {
	interface Window {
		newspackDashboard: {
			siteStatuses: {
				readerActivation: Status;
				googleAnalytics: Status;
				googleAdManager: Status & {
					isAvailable: boolean;
				};
			};
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
			sections: {
				connections: {
					label: string;
					path?: string;
					isAvailable: Record< string, boolean >;
				};
			};
		};
		newspack_aux_data: {
			is_debug_mode: boolean;
		};
	}
}

export {};
