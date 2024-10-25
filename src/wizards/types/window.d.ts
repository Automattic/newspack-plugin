declare global {
	interface Window {
		newspackWizardsAdminHeader: {
			tabs: Array< {
				textContent: string;
				href: string;
				forceSelected: boolean;
			} >;
			title: string;
		};
	}
}

export {};
