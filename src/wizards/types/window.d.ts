declare global {
	interface Window {
		newspackWizardsAdminHeader: {
			tabs: Array< {
				textContent: string;
				href: string;
			} >;
			title: string;
		};
	}
}

export {};
