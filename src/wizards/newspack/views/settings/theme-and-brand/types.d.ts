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
 * Theme and brand schema.
 */
type ThemeBrandData = {
	theme: '' | NewspackThemes;
	theme_mods: Record< string, unknown > & { homepage_pattern_index: number };
	homepage_patterns: HomepagePattern[];
};
