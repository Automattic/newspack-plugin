/* globals newspack_memberships_gate */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Fragment, useEffect } from '@wordpress/element';
import { Button, TextControl, CheckboxControl, RadioControl } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './editor.scss';

const styles = [
	{ value: 'inline', label: __( 'Inline', 'newspack' ) },
	{ value: 'overlay', label: __( 'Overlay', 'newspack' ) },
];

const overlayPlacements = [
	{ value: 'center', label: __( 'Center', 'newspack' ) },
	{ value: 'bottom', label: __( 'Bottom', 'newspack' ) },
];

const overlaySizes = [
	{ value: 'small', label: __( 'Small', 'newspack' ) },
	{ value: 'medium', label: __( 'Medium', 'newspack' ) },
	{ value: 'large', label: __( 'Large', 'newspack' ) },
];

const GateEdit = ( { editPost, createNotice, meta } ) => {
	useEffect( () => {
		if ( newspack_memberships_gate.has_campaigns ) {
			createNotice(
				'info',
				__(
					'Newspack Campaigns: Prompts will not be displayed when rendering a gated content.',
					'newspack'
				)
			);
		}
	}, [] );
	useEffect( () => {
		if ( meta.style === 'overlay' ) {
			document
				.querySelector( '.editor-styles-wrapper' )
				.setAttribute( 'data-overlay-size', meta.overlay_size );
		} else {
			document.querySelector( '.editor-styles-wrapper' ).removeAttribute( 'data-overlay-size' );
		}
	}, [ meta.style, meta.overlay_size ] );
	return (
		<Fragment>
			<PluginDocumentSettingPanel
				name="memberships-gate-styles-panel"
				title={ __( 'Styles', 'newspack' ) }
			>
				<div className="newspack-memberships-gate-style-selector">
					{ styles.map( style => (
						<Button
							key={ style.value }
							variant={ meta.style === style.value ? 'primary' : 'secondary' }
							isPressed={ meta.style === style.value }
							onClick={ () => editPost( { meta: { style: style.value } } ) }
							aria-current={ meta.style === style.value }
						>
							{ style.label }
						</Button>
					) ) }
				</div>
				{ meta.style === 'inline' && (
					<CheckboxControl
						label={ __( 'Apply fade to last paragraph', 'newspack' ) }
						checked={ meta.inline_fade }
						onChange={ value => editPost( { meta: { inline_fade: value } } ) }
						help={ __(
							'Whether to apply a gradient fade effect before rendering the gate.',
							'newspack'
						) }
					/>
				) }
				{ meta.style === 'overlay' && (
					<Fragment>
						<RadioControl
							label={ __( 'Placement', 'newspack' ) }
							selected={ meta.overlay_placement }
							options={ overlayPlacements }
							onChange={ value => editPost( { meta: { overlay_placement: value } } ) }
						/>
						<RadioControl
							label={ __( 'Size', 'newspack' ) }
							selected={ meta.overlay_size }
							options={ overlaySizes }
							onChange={ value => editPost( { meta: { overlay_size: value } } ) }
						/>
					</Fragment>
				) }
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel
				name="memberships-gate-settings-panel"
				title={ __( 'Settings', 'newspack' ) }
			>
				<TextControl
					type="number"
					value={ meta.visible_paragraphs }
					label={ __( 'Default paragraph count', 'newspack' ) }
					onChange={ value => editPost( { meta: { visible_paragraphs: value } } ) }
					help={ __(
						'Number of paragraphs that readers can see above the content gate.',
						'newspack'
					) }
				/>
				<hr />
				<CheckboxControl
					label={ __( 'Use “More” tag to manually place content gate', 'newspack' ) }
					checked={ meta.use_more_tag }
					onChange={ value => editPost( { meta: { use_more_tag: value } } ) }
					help={ __(
						'Override the default paragraph count on pages where a “More” block has been placed.',
						'newspack'
					) }
				/>
			</PluginDocumentSettingPanel>
		</Fragment>
	);
};

const GateEditWithSelect = compose( [
	withSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const meta = getEditedPostAttribute( 'meta' );
		return { meta };
	} ),
	withDispatch( dispatch => {
		const { editPost } = dispatch( 'core/editor' );
		const { createNotice } = dispatch( 'core/notices' );
		return {
			editPost,
			createNotice,
		};
	} ),
] )( GateEdit );

registerPlugin( 'newspack-memberships-gate', {
	render: GateEditWithSelect,
	icon: null,
} );
