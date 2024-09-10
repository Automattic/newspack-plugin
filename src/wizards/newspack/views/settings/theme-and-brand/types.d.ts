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
 * Typography option types.
 */
type TypographyOptions = 'curated' | 'custom';

/**
 * Typography schema.
 */
type Typography = {
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
 * Colors settings schema.
 */
type ThemeColors = {
	primary_color_hex: string;
	secondary_color_hex: string;
	theme_colors: string;
};

/**
 * Theme mods schema.
 */
type ThemeMods = { homepage_pattern_index: number } & ThemeColors & Typography;

/**
 * Theme and brand schema.
 */
type ThemeBrandData = {
	theme: '' | NewspackThemes;
	theme_mods: ThemeMods;
	homepage_patterns: HomepagePattern[];
};
