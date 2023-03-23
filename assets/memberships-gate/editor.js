/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
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

const GateEdit = ( { editPost, meta } ) => {
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
				<CheckboxControl
					label={ __( 'Use "More" tag as threshold', 'newspack' ) }
					checked={ meta.use_more_tag }
					onChange={ value => editPost( { meta: { use_more_tag: value } } ) }
					help={ __(
						'Whether to use the <!--more--> tag as the threshold for the gate.',
						'newspack'
					) }
				/>
				<hr />
				<TextControl
					type="number"
					value={ meta.visible_paragraphs }
					label={ __( 'Number of visible paragraphs', 'newspack' ) }
					onChange={ value => editPost( { meta: { visible_paragraphs: value } } ) }
					help={ __(
						"If the content doesn't have a <!--more--> tag, this will be the number of paragraphs that will be visible to non-members.",
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
		return {
			editPost,
		};
	} ),
] )( GateEdit );

registerPlugin( 'newspack-memberships-gate', {
	render: GateEditWithSelect,
	icon: null,
} );
