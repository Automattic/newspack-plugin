/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import './style.scss';

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
			const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
			// Check if this is an image block and it has an ID
			if ( props.name === 'core/image' && props.attributes.id ) {
				const imageId = props.attributes.id;

				const { meta } = useSelect(
					select => select( 'core' ).getMedia( imageId ),
					[ imageId ]
				) ?? { meta: {} };
				// Meta added, proceed
				if ( Object.keys( meta ).length > 0 ) {
					props.setAttributes( { meta } );
					unlockPostSaving( 'attachment-meta-empty' );
					return <BlockEdit { ...props } />;
				}
				// Display loading and lock post saving
				lockPostSaving( 'attachment-meta-empty' );
				return (
					<div className="newspack-block-core-image">
						<BlockEdit { ...props } />
						<div className="newspack-block-core-image__background">
							<div className="newspack-block-core-image__spinner">
								<Spinner />
							</div>
						</div>
					</div>
				);
			}

			// Return the original block edit component
			return <BlockEdit { ...props } />;
		};
	}, 'withCustomMetaData' )
);
