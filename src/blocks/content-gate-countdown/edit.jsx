/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
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
	const blockProps = useBlockProps();
	const {
		metering_period: meteringPeriod,
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		remaining_metered_views: remainingViews,
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
			<Placeholder
				icon={ caution }
				label={ __(
					'The content gate countdown block will only display in restricted content when metering is enabled.',
					'newspack-plugin'
				) }
				className="no-metering"
			/>
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

			<div className="newspack-content-gate-countdown" { ...blockProps }>
				<div className="newspack-content-gate-countdown__content">
					<div className="newspack-content-gate-countdown__text">
						<span className="newspack-content-gate-countdown__countdown">
							{ sprintf(
								/* translators: 1: remaining metered views, 2: total metered views. */ __( '%1$d/%2$d', 'newspack-plugin' ),
								Math.max( 0, parseInt( totalViews ) - parseInt( remainingViews ) ),
								parseInt( totalViews )
							) }
						</span>
						<p>{ text }</p>
					</div>
					<div className="newspack-content-gate-countdown__actions">
						<InnerBlocks
							allowedBlocks={ [ 'newspack-blocks/checkout-button', 'core/buttons', 'core/paragraph', 'core/heading' ] }
							template={ [
								[
									'core/paragraph',
									{
										content: __( 'Get unlimited access.', 'newspack-plugin' ),
										align: 'center',
										style: { typography: { fontWeight: '700' } },
									},
								],
								[
									'newspack-blocks/checkout-button',
									{
										text: __( 'Subscribe now', 'newspack-plugin' ),
										align: 'center',
									},
								],
							] }
						/>
					</div>
				</div>
			</div>
		</>
	);
}
