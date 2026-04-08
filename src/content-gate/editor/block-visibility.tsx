/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Target block types that receive access control attributes.
 */
const TARGET_BLOCKS = [ 'core/group', 'core/stack', 'core/row' ];

/**
 * Register custom attributes on target block types.
 */
addFilter(
	'blocks.registerBlockType',
	'newspack-plugin/block-visibility/attributes',
	( settings: any, name: string ) => {
		if ( ! TARGET_BLOCKS.includes( name ) ) {
			return settings;
		}
		return {
			...settings,
			attributes: {
				...settings.attributes,
				newspackAccessControlVisibility: {
					type: 'string',
					default: 'visible',
				},
				newspackAccessControlRules: {
					type: 'object',
					default: {},
				},
			},
		};
	}
);

/**
 * Inspector panel placeholder — full implementation in Task 9.
 */
const BlockVisibilityPanel = ( _props: any ) => null;

/**
 * Inject the Inspector panel into target block editors.
 */
addFilter(
	'editor.BlockEdit',
	'newspack-plugin/block-visibility/inspector',
	createHigherOrderComponent(
		BlockEdit => {
			const WithBlockVisibilityPanel = ( props: any ) => {
				if ( ! TARGET_BLOCKS.includes( props.name ) ) {
					return <BlockEdit { ...props } />;
				}
				return (
					<>
						<BlockEdit { ...props } />
						<BlockVisibilityPanel { ...props } />
					</>
				);
			};
			return WithBlockVisibilityPanel;
		},
		'withBlockVisibilityPanel'
	)
);
