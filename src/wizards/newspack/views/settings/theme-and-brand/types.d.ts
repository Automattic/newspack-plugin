/**
 * Theme names without `newspack` prefix.
 */
type ThemeNames =
	| 'theme'
	| 'scott'
	| 'nelson'
	| 'katharine'
	| 'sacha'
	| 'joseph';

/**
 * Theme names with `newspack` prefix.
 */
type NewspackThemes = `newspack-${ ThemeNames }`;

/**
 * Homepage pattern schema.
 */
type HomepagePattern = {
	content: string;
	image: string;
};

/**
 * Typography schema.
 */
type Typography = {
	type?: 'curated' | 'custom';
	font_header: string;
	font_body: string;
	accent_allcaps: boolean;
	// Curated fonts
	custom_font_import_code?: string;
	custom_font_import_code_alternate?: string;
	font_body_stack?: string;
	font_header_stack?: string;
};

/**
 * Font Group schema.
 */
type FontGroup = {
	label: string;
	fallback?: string;
	options: Array< {
		label: string;
		value: string;
	} >;
};

/**
 * Theme and brand schema.
 */
type ThemeBrandData = {
	theme: '' | NewspackThemes;
	theme_mods: Record< string, unknown > & {
		homepage_pattern_index: number;
		primary_color_hex: string;
		secondary_color_hex: string;
		theme_colors: 'default' | 'custom';
	} & Typography;
	homepage_patterns: HomepagePattern[];
};
