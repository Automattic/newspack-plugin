/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls, InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit() {
	const blockProps = useBlockProps();

	return (
		<>
			<InspectorControls />
			<div className="newspack-content-gate-countdown" { ...blockProps }>
				<div className="newspack-content-gate-countdown__content">
					<div className="newspack-content-gate-countdown__notice">
						<span className="newspack-content-gate-countdown__countdown">3 / 3</span>
						<p>{ __( 'remaining articles this month.', 'newspack-plugin' ) }</p>
					</div>
					<div className="newspack-content-gate-countdown__actions">
						<InnerBlocks
							allowedBlocks={ [ 'newspack-blocks/checkout-button', 'core/buttons', 'core/paragraph' ] }
							template={ [
								[ 'core/paragraph', { content: __( 'Get unlimited access.', 'newspack-plugin' ) } ],
								[ 'newspack-blocks/checkout-button', { text: __( 'Subscribe now', 'newspack-plugin' ), align: 'center' } ],
							] }
						/>
					</div>
				</div>
			</div>
		</>
	);
}
