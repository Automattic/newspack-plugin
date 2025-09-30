/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';

/**
 * Edit function for the Content Gate Countdown Box block.
 *
 * @return {JSX.Element} The Content Gate Countdown Box block.
 */
export default function Edit() {
	const {
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		metering_period: period,
	} = newspack_blocks.content_gate_data || {};
	const blockProps = useBlockProps( {
		className: 'newspack-content-gate-countdown-box__wrapper has-border-color has-base-3-border-color',
		style: {
			borderWidth: '1px',
			borderRadius: '6px',
		},
	} );
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
														textColor: 'secondary',
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
		<div { ...blockProps }>
			<div { ...innerBlockProps }>{ children }</div>
		</div>
	);
}
