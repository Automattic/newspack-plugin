/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Edit function for the Content Gate Countdown block.
 *
 * @return {JSX.Element} The Content Gate Countdown block.
 */
export default function Edit() {
	const blockProps = useBlockProps();

	return (
		<>
			<div className="newspack-content-gate-countdown" { ...blockProps }>
				<div className="newspack-content-gate-countdown__content">
					<div className="newspack-content-gate-countdown__notice">
						<span className="newspack-content-gate-countdown__countdown">
							{ sprintf(
								/* translators: 1: remaining metered views, 2: total metered views. */ __( '%1$d/%2$d', 'newspack-plugin' ),
								3,
								3
							) }
						</span>
						<p>{ __( 'free articles this month', 'newspack-plugin' ) }</p>
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
										layout: { type: 'flex', justifyContent: 'center' },
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
