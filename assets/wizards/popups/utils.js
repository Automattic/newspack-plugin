export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

export const isAboveHeader = popup => 'above_header' === popup.options.placement;
