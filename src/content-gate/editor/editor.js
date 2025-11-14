/* globals newspack_content_gate */

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Fragment, useEffect } from '@wordpress/element';
import { Button, CheckboxControl, SelectControl, TextControl } from '@wordpress/components';
import { PluginDocumentSettingPanel, PluginPostStatusInfo } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import MeteringSettings from './metering-settings';
import PositionControl from '../../../packages/components/src/position-control';
import './editor.scss';

const styles = [
	{ value: 'inline', label: __( 'Inline', 'newspack-plugin' ) },
	{ value: 'overlay', label: __( 'Overlay', 'newspack-plugin' ) },
];

const overlayPositionsLabels = {
	center: __( 'center', 'newspack-plugin' ),
	bottom: __( 'bottom', 'newspack-plugin' ),
};

const overlaySizes = [
	{ value: 'x-small', label: __( 'Extra Small', 'newspack-plugin' ) },
	{ value: 'small', label: __( 'Small', 'newspack-plugin' ) },
	{ value: 'medium', label: __( 'Medium', 'newspack-plugin' ) },
	{ value: 'large', label: __( 'Large', 'newspack-plugin' ) },
	{ value: 'full-width', label: __( 'Full Width', 'newspack-plugin' ) },
];

function GateEdit() {
	const { meta } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			meta: getEditedPostAttribute( 'meta' ),
		};
	} );
	const { editPost } = useDispatch( 'core/editor' );
	useEffect( () => {
		const wrapper = document.querySelector( '.editor-styles-wrapper' );
		if ( ! wrapper ) {
			return;
		}
		if ( meta.style === 'overlay' ) {
			wrapper.setAttribute( 'data-overlay-size', meta.overlay_size );
		} else {
			wrapper.removeAttribute( 'data-overlay-size' );
		}
	}, [ meta.style, meta.overlay_size ] );
	const { createNotice } = useDispatch( 'core/notices' );
	useEffect( () => {
		if ( Object.keys( newspack_content_gate.gate_plans ).length ) {
			createNotice(
				'info',
				sprintf(
					// translators: %s is the list of plans.
					__( "You're currently editing a gate for content restricted by: %s", 'newspack-plugin' ),
					Object.values( newspack_content_gate.gate_plans ).join( ', ' )
				)
			);
		}
	}, [] );
	const getPlansToEdit = () => {
		const currentGatePlans = Object.keys( newspack_content_gate.gate_plans ) || [];
		const plans = newspack_content_gate.plans.filter( plan => {
			return ! currentGatePlans.includes( plan.id.toString() );
		} );
		return plans;
	};
	return (
		<Fragment>
			{ newspack_content_gate.has_campaigns && (
				<PluginPostStatusInfo>
					<p>{ __( "Newspack Campaign prompts won't be displayed when rendering gated content.", 'newspack-plugin' ) }</p>
				</PluginPostStatusInfo>
			) }
			{ newspack_content_gate.plans.length > 1 && (
				<PluginDocumentSettingPanel name="content-gate-plans" title={ __( 'WooCommerce Memberships', 'newspack-plugin' ) }>
					{ ! Object.keys( newspack_content_gate.gate_plans ).length ? (
						<Fragment>
							<p>
								{ __(
									'This gate will be rendered for all membership plans. Manage custom gates for when the content is locked behind a specific plan:',
									'newspack-plugin'
								) }
							</p>
						</Fragment>
					) : (
						<Fragment>
							<p>
								{ sprintf(
									// translators: %s is the list of plans.
									__( 'This gate will be rendered for the following membership plans: %s', 'newspack-plugin' ),
									Object.values( newspack_content_gate.gate_plans ).join( ', ' )
								) }
							</p>
							<hr />
							<p
								dangerouslySetInnerHTML={ {
									__html: sprintf(
										// translators: %s is the link to the primary gate.
										__( 'Edit the <a href="%s">primary gate</a>, or:', 'newspack-plugin' ),
										newspack_content_gate.edit_gate_url
									),
								} }
							/>
						</Fragment>
					) }
					<ul>
						{ getPlansToEdit().map( plan => (
							<li key={ plan.id }>
								{ plan.name } (
								{ plan.gate_id !== false && (
									<Fragment>
										<strong>
											{ plan.gate_status === 'publish'
												? __( 'published', 'newspack-plugin' )
												: __( 'draft', 'newspack-plugin' ) }
										</strong>{ ' ' }
										-{ ' ' }
									</Fragment>
								) }
								<a href={ newspack_content_gate.edit_plan_gate_url + '&plan_id=' + plan.id }>
									{ plan.gate_id ? __( 'edit gate', 'newspack-plugin' ) : __( 'create gate', 'newspack-plugin' ) }
								</a>
								)
							</li>
						) ) }
					</ul>
				</PluginDocumentSettingPanel>
			) }
			<PluginDocumentSettingPanel name="content-gate-styles-panel" title={ __( 'Styles', 'newspack-plugin' ) }>
				<div className="newspack-content-gate-style-selector">
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
						label={ __( 'Apply fade to last paragraph', 'newspack-plugin' ) }
						checked={ meta.inline_fade }
						onChange={ value => editPost( { meta: { inline_fade: value } } ) }
						help={ __( 'Whether to apply a gradient fade effect before rendering the gate.', 'newspack-plugin' ) }
					/>
				) }
				{ meta.style === 'overlay' && (
					<Fragment>
						<SelectControl
							label={ __( 'Size', 'newspack-plugin' ) }
							value={ meta.overlay_size }
							options={ overlaySizes }
							onChange={ value => editPost( { meta: { overlay_size: value } } ) }
						/>
						<PositionControl
							label={ __( 'Position', 'newspack-plugin' ) }
							value={ meta.overlay_position }
							size={ meta.overlay_size }
							allowedPositions={ [ 'bottom', 'center' ] }
							onChange={ value => editPost( { meta: { overlay_position: value } } ) }
							help={ sprintf(
								// translators: %s is the placement of the gate.
								__( 'The gate will be displayed at the %s of the screen.', 'newspack-plugin' ),
								overlayPositionsLabels[ meta.overlay_position ]
							) }
						/>
					</Fragment>
				) }
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel name="content-gate-settings-panel" title={ __( 'Settings', 'newspack-plugin' ) }>
				<TextControl
					type="number"
					min="0"
					value={ meta.visible_paragraphs }
					label={ __( 'Default paragraph count', 'newspack-plugin' ) }
					onChange={ value => editPost( { meta: { visible_paragraphs: value } } ) }
					help={ __( 'Number of paragraphs that readers can see above the content gate.', 'newspack-plugin' ) }
				/>
				<hr />
				<CheckboxControl
					label={ __( 'Use “More” tag to manually place content gate', 'newspack-plugin' ) }
					checked={ meta.use_more_tag }
					onChange={ value => editPost( { meta: { use_more_tag: value } } ) }
					help={ __( 'Override the default paragraph count on pages where a “More” block has been placed.', 'newspack-plugin' ) }
				/>
			</PluginDocumentSettingPanel>
			<PluginDocumentSettingPanel name="content-gate-metering-panel" title={ __( 'Metering', 'newspack-plugin' ) }>
				<MeteringSettings />
			</PluginDocumentSettingPanel>
		</Fragment>
	);
}

registerPlugin( 'newspack-content-gate', {
	render: GateEdit,
	icon: null,
} );
