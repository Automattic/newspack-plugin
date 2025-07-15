// Types for the collections settings feature

type CollectionsSettingsData = {
	custom_naming_enabled: boolean;
	custom_name: string;
	custom_singular_name: string;
	custom_slug: string;
	subscribe_link: string;
	order_link: string;
	post_indicator_style: string;
	card_message: string;
	posts_per_page: number;
	highlight_latest: boolean;
};

type FieldChangeHandler< T > = < K extends keyof T >( key: K, value: T[ K ] ) => void;
