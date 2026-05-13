/**
 * Rolling Content demo — Edit info modal.
 *
 * Shared info modal used for both Rolling Content and Entry "Edit" row actions.
 * Explains that, in a real implementation, this would open the block editor.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';

type ItemType = 'rolling-content' | 'entry';

export default function EditInfoModal( { itemType, title, onClose }: { itemType: ItemType; title: string; onClose: () => void } ) {
	const itemNoun = itemType === 'entry' ? __( 'entry', 'newspack-plugin' ) : __( 'rolling content', 'newspack-plugin' );

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: item type, e.g. "rolling content" or "entry". */
				__( 'Edit %s', 'newspack-plugin' ),
				itemNoun
			) }
			onRequestClose={ onClose }
			size="medium"
		>
			<p>
				{ sprintf(
					/* translators: %s: item title. */
					__( 'This would open the block editor for %s.', 'newspack-plugin' ),
					title
				) }
			</p>
			<div style={ { display: 'flex', justifyContent: 'flex-end', marginTop: 16 } }>
				<Button variant="primary" onClick={ onClose }>
					{ __( 'Got it', 'newspack-plugin' ) }
				</Button>
			</div>
		</Modal>
	);
}
