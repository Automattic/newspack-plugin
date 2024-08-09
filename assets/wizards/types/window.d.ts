declare global {
	interface Window {
		newspackWizardsAdminTabs: {
			tabs: Array< {
				textContent: string;
				href: string;
			} >;
			title: string;
		};
	}
}

export {};
