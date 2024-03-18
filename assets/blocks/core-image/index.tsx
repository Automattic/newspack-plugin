/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

import * as ImageBlockTypes from './types';

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
const AttributesLoader = ( { setAttributes, attributes }: ImageBlockTypes.AttributeProps ) => {
	const imageId = attributes.id;
	const { meta }: { meta: ImageBlockTypes.AttributesMeta } = useSelect(
		select => select( 'core' ).getMedia( imageId ),
		[ imageId ]
	) ?? {
		meta: {},
	};
	useEffect( () => {
		// Meta added, proceed
		if ( Object.keys( meta ).length ) {
			setAttributes( { meta } );
		}
	}, [ Object.keys( meta ).length ] );

	return (
		<></>
	);
};

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-edit-hook/core-image',
	createHigherOrderComponent( BlockEdit => {
		const blockEditComponent = (
			props: ImageBlockTypes.BaseProps< ImageBlockTypes.Attributes >
		) => {
			if ( props.name === 'core/image' ) {
				return (
					<>
						<BlockEdit { ...props } />
						<AttributesLoader { ...props } />
					</>
				);
			}
			return <BlockEdit { ...props } />;
		};
		return blockEditComponent;
	}, 'withCustomMetaData' )
);
