/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Placeholder, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit( { attributes, setAttributes } ) {
	const {
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		metering_period: period,
	} = newspack_blocks.content_gate_data || {};
	const blockProps = useBlockProps( { className: 'newspack-content-gate-countdown-box__wrapper' } );
	const { children, ...innerBlockProps } = useInnerBlocksProps(
		{ className: 'newspack-content-gate-countdown__actions' },
		{
			allowedBlocks: [ 'core/paragraph', 'core/heading', 'core/buttons', 'newspack-blocks/checkout-button' ],
			template: [
				[ 'newspack/content-gate-countdown' ],
				[
					'core/paragraph',
					{
						content: sprintf(
							// translators: 1: metering period (week, month).
							__( 'Free articles this %s', 'newspack-plugin' ),
							period || __( 'week', 'newspack-plugin' )
						),
						style: { typography: { fontWeight: '700' } },
					},
				],
				[
					'core/paragraph',
					{
						align: 'center',
						content: __( 'Get unlimited access.', 'newspack-plugin' ),
						style: { typography: { fontWeight: '700' } },
					},
				],
				[
					'newspack-blocks/checkout-button',
					{
						text: __( 'Subscribe now', 'newspack-plugin' ),
						align: 'center',
						backgroundColor: 'primary',
						textColor: 'secondary',
					},
				],
			],
		}
	);

	if ( ! loggedinViews && ! anonymousViews ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ caution }
					label={ __( 'Content Gate Countdown Box', 'newspack-plugin' ) }
					className="newspack-content-gate-countdown-box__placeholder"
				>
					{ __( 'The content gate countdown block will only display in restricted content when metering is enabled.', 'newspack-plugin' ) }
				</Placeholder>
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Countdown Box Settings', 'newspack-plugin' ) } initialOpen={ true }>
					<ToggleControl
						label={ __( 'Always show countdown box', 'newspack-plugin' ) }
						checked={ attributes.alwaysShow }
						onChange={ () => setAttributes( { alwaysShow: ! attributes.alwaysShow } ) }
						help={
							attributes.alwaysShow
								? __(
										'The countdown box will always be visible, even if the user has reached their metered view limit.',
										'newspack-plugin'
								  )
								: __(
										'The countdown box will only be visible while the user has not yet reached their metered view limit.',
										'newspack-plugin'
								  )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="newspack-content-gate-countdown-box__content">
					<div { ...innerBlockProps }>{ children }</div>
				</div>
			</div>
		</>
	);
}
