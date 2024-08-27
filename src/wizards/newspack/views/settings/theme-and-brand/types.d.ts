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
 * Theme and brand data.
 */
type ThemeBrandData = {
	theme: '' | NewspackThemes;
	theme_mods?: {};
	homepage_patterns?: {};
};
