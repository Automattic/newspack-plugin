/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Add image credit meta to core/image block attributes
 */
addFilter( 'blocks.registerBlockType', 'newspack-blocks', ( settings, name ) => {
	if ( name !== 'core/image' ) {
		return settings;
	}
	return {
		...settings,
		attributes: {
			...settings.attributes,
			meta: {
				type: 'object',
				default: {},
			},
		},
	};
} );

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-blocks',
	createHigherOrderComponent( BlockEdit => {
		// eslint-disable-next-line react/display-name
		return props => {
			// Check if this is an image block and it has an ID
			if ( props.name === 'core/image' && props.attributes.id ) {
				const imageId = props.attributes.id;

				const { meta } = useSelect(
					select => select( 'core' ).getMedia( imageId ),
					[ imageId ]
				) ?? { meta: {} };

				if ( Object.keys( meta ).length > 0 ) {
					props.setAttributes( { meta } );
				}
			}

			// Return the original block edit component
			return <BlockEdit { ...props } />;
		};
	}, 'withCustomMetaData' )
);
