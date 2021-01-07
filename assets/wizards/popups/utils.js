export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;
