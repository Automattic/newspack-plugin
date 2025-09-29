/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit() {
	const blockProps = useBlockProps( { className: 'newspack-content-gate-countdown__wrapper' } );
	const {
		loggedin_metered_views: loggedinViews,
		anonymous_metered_views: anonymousViews,
		metered_views: views,
	} = newspack_blocks.content_gate_data || {};

	// Admin is always logged in, so if no loggedin metered views are set, use the anonymous views instead.
	const totalViews = loggedinViews > 0 ? loggedinViews : anonymousViews;

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
			<div { ...blockProps }>
				<p className="newspack-content-gate-countdown__countdown">
					{ sprintf(
						/* translators: 1: current number of metered views, 2: total metered views. */ __( '%1$d/%2$d', 'newspack-plugin' ),
						parseInt( views ),
						parseInt( totalViews )
					) }
				</p>
			</div>
		</>
	);
}
