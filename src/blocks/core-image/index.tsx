/**
 * External dependencies
 */

import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { CheckboxControl, PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as core } from '@wordpress/core-data';

import * as ImageBlockTypes from './types';

const currentUrl = window.location.href;

/**
 * Add image credit meta to core/image block attributes
 */
addFilter( 'blocks.registerBlockType', 'newspack-plugin/register-hook/core-image', ( settings, name ) => {
	if ( name !== 'core/image' ) {
		return settings;
	}
	return {
		...settings,
		attributes: {
			...settings.attributes,
			showCredit: {
				type: 'boolean',
				default: true,
			},
			meta: {
				type: 'object',
				default: {},
			},
		},
	};
} );

/**
 * Display spinner and lock post saving until meta attributes are added to block
 */
const AttributesLoader = ( { clientId, setAttributes, attributes, isSelected }: ImageBlockTypes.AttributeProps ) => {
	const blockId = `block-${ clientId }`;
	const imageId = attributes.id;
	const { editEntityRecord } = useDispatch( core );
	const updateCreditMeta = ( key: string, value: string ) => editEntityRecord( 'postType', 'attachment', imageId, { meta: { [ key ]: value } } );
	const { meta = {} as ImageBlockTypes.AttributesMeta, editedMeta = {} as ImageBlockTypes.AttributesMeta } = useSelect(
		select => {
			const { getEditedEntityRecord, getEntityRecord } = select( core );
			const attachment = getEntityRecord( 'postType', 'attachment', imageId ) as { meta?: ImageBlockTypes.AttributesMeta } | null;
			const editedAttachment = getEditedEntityRecord( 'postType', 'attachment', imageId ) as { meta?: ImageBlockTypes.AttributesMeta } | null;
			return {
				meta: attachment?.meta,
				editedMeta: editedAttachment?.meta,
			};
		},
		[ imageId ]
	);

	const blockRef = useRef( null as HTMLElement | null );

	useEffect( () => {
		blockRef.current = document.getElementById( blockId );
	}, [] );

	// Set image meta as block attributes. Only update attributes with saved attachment meta.
	useEffect( () => {
		// Meta added, proceed
		if ( Object.keys( meta ).length ) {
			const { _media_credit, _media_credit_url, _navis_media_credit_org, _navis_media_can_distribute } = meta;
			// Only trigger if our meta has updated.
			if (
				_media_credit !== attributes?.meta?._media_credit ||
				_media_credit_url !== attributes?.meta?._media_credit_url ||
				_navis_media_credit_org !== attributes?.meta?._navis_media_credit_org ||
				_navis_media_can_distribute !== attributes?.meta?._navis_media_can_distribute
			) {
				setAttributes( { meta: { _media_credit, _media_credit_url, _navis_media_credit_org, _navis_media_can_distribute } } );
			}
		}
	}, [
		meta,
		attributes?.meta?._media_credit,
		attributes?.meta?._media_credit_url,
		attributes?.meta?._navis_media_credit_org,
		attributes?.meta?._navis_media_can_distribute,
	] );

	return (
		<>
			{ isSelected && editedMeta && (
				<InspectorControls>
					<PanelBody title={ __( 'Image Credit', 'newspack-plugin' ) }>
						<ToggleControl
							help={ __( 'Show the image credit alongside the caption.', 'newspack-plugin' ) }
							label={ __( 'Show Credit', 'newspack-plugin' ) }
							checked={ attributes?.showCredit }
							onChange={ value => setAttributes( { showCredit: value } ) }
						/>
						{ attributes?.showCredit && (
							<>
								<TextControl
									label={ __( 'Credit', 'newspack-plugin' ) }
									value={ editedMeta?._media_credit || '' }
									onChange={ value => updateCreditMeta( '_media_credit', value ) }
								/>
								<TextControl
									label={ __( 'Credit URL', 'newspack-plugin' ) }
									value={ editedMeta?._media_credit_url || '' }
									onChange={ value => updateCreditMeta( '_media_credit_url', value ) }
								/>
								<TextControl
									label={ __( 'Credit Organization', 'newspack-plugin' ) }
									value={ editedMeta?._navis_media_credit_org || '' }
									onChange={ value => updateCreditMeta( '_navis_media_credit_org', value ) }
								/>
								<CheckboxControl
									label={ __( 'Can distribute?', 'newspack-plugin' ) }
									checked={ editedMeta?._navis_media_can_distribute ? true : false }
									onChange={ value => updateCreditMeta( '_navis_media_can_distribute', value ? '1' : '' ) }
								/>
							</>
						) }
					</PanelBody>
				</InspectorControls>
			) }
		</>
	);
};

/**
 * Compare two urls strings and determine if they're from the same origin.
 */
const isSameOrigin = ( urlOne: string, urlTwo = currentUrl ) => {
	const hostOne = new URL( urlOne ).hostname;
	const hostTwo = new URL( urlTwo ).hostname;
	return hostOne === hostTwo;
};

/**
 * Populate attributes with meta data.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-edit-hook/core-image',
	createHigherOrderComponent( BlockEdit => {
		const blockEditComponent = ( props: ImageBlockTypes.BaseProps< ImageBlockTypes.Attributes > ) => {
			if ( props.name === 'core/image' ) {
				return (
					<>
						<BlockEdit { ...props } />
						{ props.attributes.url && isSameOrigin( props.attributes.url ) && <AttributesLoader { ...props } /> }
					</>
				);
			}
			return <BlockEdit { ...props } />;
		};
		return blockEditComponent;
	}, 'withCustomMetaData' )
);
