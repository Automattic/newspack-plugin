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
		newspackAudience: {
			has_reader_activation: boolean;
			has_memberships: boolean;
			new_subscription_lists_url: string;
			reader_activation_url: string;
			preview_query_keys: {
				[ K in PromptOptionsBaseKey ]: string;
			};
			preview_post: string;
			preview_archive: string;
		};
		newspack_reader_revenue: {
			can_use_name_your_price: boolean;
		};
	}
}

export {};
