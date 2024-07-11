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
			connections: {
				label: string;
				path?: string;
				sections: {
					[ k: string ]: {
						editLink?: string;
						dependencies?: Record< string, string >;
						enabled?: Record< string, boolean >;
					} & Record< string, any >;
				};
			};
			emails: {
				label: string;
				path?: string;
				sections: {
					emails: {
						all: {
							[ str: string ]: {
								label: string;
								description: string;
								post_id: number;
								edit_link: string;
								subject: string;
								from_name: string;
								from_email: string;
								reply_to_email: string;
								status: string;
							};
						};
						dependencies: Record< string, boolean >;
						postType: string;
					};
				};
			};
		};
		newspack_aux_data: {
			is_debug_mode: boolean;
		};
	}
}

export {};
