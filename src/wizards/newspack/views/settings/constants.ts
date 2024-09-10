/**
 * Constants for the settings page.
 */

/**
 * Settings page namespace.
 */
export const PAGE_NAMESPACE = 'newspack-settings';

/* export const DEFAULT_THEME_MODS = {
	font_header: '',
	font_body: '',
	custom_font_import_code: undefined,
	custom_font_import_code_alternate: undefined,
	
	header_center_logo: false,
	header_simplified: false,
	header_solid_background: false,
	logo_size: 0,
	header_text: false,
	header_display_tagline: false,
	footer_color_hex: '',
	newspack_footer_logo: '',
}; */

const OPTIONAL_THEME_MODS = {};

export const DEFAULT_THEME_MODS = {
	header_color: 'custom',
	theme_colors: 'default',
	primary_color_hex: '#3366ff',
	secondary_color_hex: '#666666',
	header_color_hex: '#3366ff',
	homepage_pattern_index: 0,
	accent_allcaps: true,
	footer_color: 'default',
	footer_logo_size: 'medium',
	footer_copyright: '',
	header_text: false,
	header_display_tagline: false,

	font_header: '',
	font_body: '',
	custom_font_import_code: undefined,
	custom_font_import_code_alternate: undefined,

	header_center_logo: false,
	header_simplified: false,
	header_solid_background: false,
	logo_size: 0,
	footer_color_hex: '',
	newspack_footer_logo: '',

	custom_logo: '',

	custom_css_post_id: -1, //
	newspack_image_credits_class_name: 'image-credit', //
	newspack_image_credits_prefix_label: 'Credit:', //
	newspack_image_credits_placeholder: null, //
	newspack_image_credits_auto_populate: false, //
};

export default {
	PAGE_NAMESPACE,
};
