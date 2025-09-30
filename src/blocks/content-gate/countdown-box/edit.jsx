/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Placeholder, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';

/**
 * Edit function for the Content Gate Countdown Box block.
 *
 * @return {JSX.Element} The Content Gate Countdown Box block.
 */
export default function Edit( { attributes, setAttributes } ) {
	const {
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		metering_period: period,
	} = newspack_blocks.content_gate_data || {};
	const blockProps = useBlockProps( { className: 'newspack-content-gate-countdown-box__wrapper' } );
	const { children, ...innerBlockProps } = useInnerBlocksProps(
		{ className: 'newspack-content-gate-countdown-box__content' },
		{
			template: [
				[
					'core/group',
					{
						layout: { type: 'constrained' },
					},
					[
						[
							'core/columns',
							{ verticalAlignment: 'center' },
							[
								[
									'core/column',
									{
										verticalAlignment: 'center',
										width: '20%',
									},
									[
										[
											'core/group',
											{
												layout: {
													type: 'flex',
													flexWrap: 'nowrap',
												},
											},
											[
												[
													'newspack/content-gate-countdown',
													{
														textColor: 'primary',
													},
												],
												[
													'core/paragraph',
													{
														content: sprintf(
															/* translators: %s is the metered period, e.g. "month" or "week". */
															__( 'free articles this %s', 'newspack-plugin' ),
															period
														),
														align: 'left',
														fontSize: 'small',
														style: {
															typography: {
																textTransform: 'uppercase',
															},
														},
														textColor: 'secondary-variation',
													},
												],
											],
										],
									],
								],
								[
									'core/column',
									{
										verticalAlignment: 'center',
										width: '60%',
									},
									[
										[
											'core/heading',
											{
												content: __( 'Get unlimited access', 'newspack-plugin' ),
												level: 4,
												textAlign: 'center',
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
								],
								[ 'core/column', { width: '20%' } ],
							],
						],
					],
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
					{ __(
						'The content gate countdown box block will only display in restricted content when metering is enabled.',
						'newspack-plugin'
					) }
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
										'The countdown box will always be visible, even when readers have reached their metered view limit and the content gate is shown.',
										'newspack-plugin'
								  )
								: __(
										'The countdown box will only be visible when readers are within their metered view limit and the content gate is not shown.',
										'newspack-plugin'
								  )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div { ...innerBlockProps }>{ children }</div>
			</div>
		</>
	);
}
