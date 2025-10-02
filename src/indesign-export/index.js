import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockEditingMode } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';

const addAttribute = settings => {
	settings.attributes = {
		...settings.attributes,
		indesignTag: {
			type: 'string',
			default: '',
		},
	};

	return settings;
};

const TagNameControl = ( { blockName, indesignTag, setAttributes } ) => {
	const blockEditingMode = useBlockEditingMode();
	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	// Only paragraphs and heading can have custom tag names.
	if ( ! [ 'core/paragraph', 'core/heading' ].includes( blockName ) ) {
		return null;
	}

	return (
		<InspectorControls group="advanced">
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'InDesign Exporter Tag Name', 'newspack-plugin' ) }
				help={ __( 'Define a custom tag name to be used in the Tagged Text export.', 'newspack-plugin' ) }
				value={ indesignTag }
				onChange={ value => setAttributes( { indesignTag: value } ) }
			/>
		</InspectorControls>
	);
};

const addTagNameControl = BlockEdit => {
	return props => {
		return (
			<>
				<BlockEdit { ...props } />
				<TagNameControl blockName={ props.name } indesignTag={ props.attributes.indesignTag } setAttributes={ props.setAttributes } />
			</>
		);
	};
};

addFilter( 'blocks.registerBlockType', 'newspack-plugin/indesign-export', addAttribute );
addFilter( 'editor.BlockEdit', 'newspack-plugin/indesign-export', addTagNameControl );
