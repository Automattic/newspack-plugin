/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Placeholder, TextareaControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'newspack-content-gate-countdown__wrapper' } );
	const { children, ...innerBlockProps } = useInnerBlocksProps(
		{ className: 'newspack-content-gate-countdown__actions' },
		{
			allowedBlocks: [ 'core/paragraph', 'core/heading', 'core/buttons', 'newspack-blocks/checkout-button' ],
			template: [
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
	const {
		metering_period: meteringPeriod,
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		metered_views: views,
	} = newspack_blocks.content_gate_data || {};
	const [ text, setText ] = useState(
		attributes.text
			? attributes.text
			: sprintf(
					/* translators: %s is the metered period, e.g. "month" or "week". */
					__( 'free articles this %s', 'newspack-plugin' ),
					meteringPeriod
			  )
	);
	// Admin is always logged in, so if no loggedin metered views are set, use the anonymous views instead.
	const totalViews = loggedinViews > 0 ? loggedinViews : anonymousViews;
	const handleChange = value => {
		setAttributes( { text: value } );
		setText( value );
	};

	if ( ! totalViews ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ caution }
					label={ __(
						'The content gate countdown block will only display in restricted content when metering is enabled.',
						'newspack-plugin'
					) }
					className="no-metering"
				/>
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Countdown Settings', 'newspack-plugin' ) } initialOpen={ true }>
					<TextareaControl
						label={ __( 'Countdown text', 'newspack-plugin' ) }
						rows="3"
						help={ __( 'The text that appears next to the countdown.', 'newspack-plugin' ) }
						value={ text }
						onChange={ handleChange }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="newspack-content-gate-countdown__content">
					<div className="newspack-content-gate-countdown__text">
						<span className="newspack-content-gate-countdown__countdown">
							{ sprintf(
								/* translators: 1: current number of metered views, 2: total metered views. */ __( '%1$d/%2$d', 'newspack-plugin' ),
								parseInt( views ),
								parseInt( totalViews )
							) }
						</span>
						<p>{ text }</p>
					</div>
					<div { ...innerBlockProps }>{ children }</div>
				</div>
			</div>
		</>
	);
}
