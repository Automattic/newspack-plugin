/* globals newspack_memberships_gate */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Fragment, useEffect } from '@wordpress/element';
import { Button, TextControl, CheckboxControl } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './editor.scss';

const styles = [
	{ name: 'inline', label: __( 'Inline', 'newspack' ) },
	{ name: 'overlay', label: __( 'Overlay (soon)', 'newspack' ) },
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
	return (
		<Fragment>
			<PluginDocumentSettingPanel
				name="memberships-gate-styles-panel"
				title={ __( 'Styles', 'newspack' ) }
			>
				<div className="newspack-memberships-gate-style-selector">
					{ styles.map( style => (
						<Button
							key={ style.name }
							variant={ meta.style === style.name ? 'primary' : 'secondary' }
							isPressed={ meta.style === style.name }
							onClick={ () => editPost( { meta: { style: style.name } } ) }
							aria-current={ meta.style === style.name }
							disabled={ style.name === 'overlay' }
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
						'Number of paragraphs that readers can see above the content gate if they have not yet registered/subscribed/converted.',
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
