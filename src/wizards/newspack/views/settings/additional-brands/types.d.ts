interface ThemeColorsMeta {
	color: string;
	name: string;
	theme_mod_name?: string;
	default?: string;
}

type Brand = {
	id: number;
	count: number;
	description: string;
	link: string;
	name: string;
	slug: string;
	taxonomy: string;
	parent: number;
	meta: {
		_custom_url: string;
		_show_page_on_front: number;
		_logo: number | Attachment;
		_theme_colors: ThemeColorsMeta[];
		_menus: Array< {
			location: string;
			menu: number;
		} >;
	};
	yoast_head?: string;
	yoast_head_json?: {
		title: string;
		robots: {
			index: string;
			follow: string;
			'max-snippet': string;
			'max-image-preview': string;
			'max-video-preview': string;
		};
		og_locale: string;
		og_type: string;
		og_title: string;
		og_url: string;
		og_site_name: string;
		twitter_card: string;
		twitter_site: string;
		schema: {
			'@context': string;
			'@graph': Array< {
				'@type': string;
				'@id': string;
				[ key: string ]: any;
			} >;
		};
	};
	_links?: {
		self: Array< { href: string } >;
		collection: Array< { href: string } >;
		about: Array< { href: string } >;
		'wp:post_type': Array< { href: string } >;
		curies: Array< {
			name: string;
			href: string;
			templated: boolean;
		} >;
	};
};
