/**
 * Check whether the given popup is an overlay.
 *
 * @param {object} popup Popup object to check.
 * @return {boolean} True if the popup is an overlay, otherwise false.
 */
export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

/**
 * Check whether the given popup is above-header.
 *
 * @param {object} popup Popup object to check.
 * @return {boolean} True if the popup is a above-header, otherwise false.
 */
export const isAboveHeader = popup => 'above_header' === popup.options.placement;

/**
 * Filter out "Uncategorized" category, which for purposes of Campaigns behaves identically to no category.
 *
 * @param {array} categories Array of category objects.
 * @return {array} Filtered array of categories, without Uncategorized category.
 */
export const filterOutUncategorized = categories => {
	return categories.filter( category => 'uncategorized' !== category.slug );
};
