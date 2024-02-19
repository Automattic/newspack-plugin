/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
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
 * Display spinner and lock post saving until meta attributes are added to block
 */
const AttributesLoader = props => {
	const imageId = props.attributes.id;
	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const { meta } = useSelect( select => select( 'core' ).getMedia( imageId ), [ imageId ] ) ?? {
		meta: {},
	};
	useEffect( () => {
		// Meta added, proceed
		if ( Object.keys( meta ).length ) {
			props.setAttributes( { meta } );
			unlockPostSaving( 'attachment-meta-empty' );
		} else {
			lockPostSaving( 'attachment-meta-empty' );
		}
	}, [ meta ] );

	return (
		<>
			{ ! Object.keys( meta ).length && (
				<div className="newspack-block__core-image-background">
					<div className="newspack-block__core-image-spinner">
						<Spinner />
					</div>
				</div>
			) }
		</>
	);
};

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-edit-hook/core-image',
	createHigherOrderComponent( BlockEdit => {
		const blockEditComponent = props => {
			if ( props.name === 'core/image' ) {
				return (
					<div className="newspack-block__core-image">
						<BlockEdit { ...props } />
						<AttributesLoader { ...props } />
					</div>
				);
			}
			return <BlockEdit { ...props } />;
		};
		return blockEditComponent;
	}, 'withCustomMetaData' )
);
