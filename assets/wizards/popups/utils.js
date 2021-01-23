export const isOverlay = popup =>
	[ 'top', 'bottom', 'center' ].indexOf( popup.options.placement ) >= 0;

export const getCardClassName = ( { options, sitewide_default: sitewideDefault, status } ) => {
		if ( 'draft' === status ) {
			return 'newspack-card__is-disabled';
		}
		if ( sitewideDefault ) {
			return 'newspack-card__is-primary';
		}
		if ( isOverlay( { options } ) && ! sitewideDefault ) {
			return 'newspack-card__is-disabled';
		}
		return 'newspack-card__is-supported';
	};
