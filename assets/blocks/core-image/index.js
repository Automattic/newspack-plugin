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
addFilter(
	'blocks.registerBlockType',
	'newspack-plugin/register-hook/core-image',
	( settings, name ) => {
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
	}
);

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-edit-hook/core-image',
	createHigherOrderComponent( BlockEdit => {
		// eslint-disable-next-line react/display-name
		return props => {
			const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
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
				}
				// Display loading and lock post saving
				lockPostSaving( 'attachment-meta-empty' );
				return (
					<div className="newspack-block__core-image">
						<BlockEdit { ...props } />
						{ Object.keys( meta ).length > 0 && (
							<div className="newspack-block__core-image-background">
								<div className="newspack-block__core-image-spinner">
									<Spinner />
								</div>
							</div>
						) }
					</div>
				);
			}

			// Return the original block edit component
			return <BlockEdit { ...props } />;
		};
	}, 'withCustomMetaData' )
);
