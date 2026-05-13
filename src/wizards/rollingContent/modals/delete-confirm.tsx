/**
 * Rolling Content demo — Delete confirmation modal.
 *
 * Shared destructive confirmation used for both Rolling Content and Entry deletes.
 * On confirm, calls `onConfirm`; the caller mutates local state.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';

type ItemType = 'rolling-content' | 'entry';

const ITEM_NOUN: Record< ItemType, string > = {
	'rolling-content': __( 'rolling content', 'newspack-plugin' ),
	entry: __( 'entry', 'newspack-plugin' ),
};

export default function DeleteConfirmModal( {
	itemType,
	title,
	onConfirm,
	onClose,
}: {
	itemType: ItemType;
	title: string;
	onConfirm: () => void;
	onClose: () => void;
} ) {
	return (
		<Modal
			title={ sprintf(
				/* translators: %s: item title. */
				__( 'Delete %s', 'newspack-plugin' ),
				title
			) }
			onRequestClose={ onClose }
			size="small"
		>
			<p>
				{ sprintf(
					/* translators: %s: item type. */
					__( 'This will permanently delete this %s. This action cannot be undone.', 'newspack-plugin' ),
					ITEM_NOUN[ itemType ]
				) }
			</p>
			<div style={ { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 } }>
				<Button variant="tertiary" onClick={ onClose }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button
					variant="primary"
					isDestructive
					onClick={ () => {
						onConfirm();
						onClose();
					} }
				>
					{ __( 'Delete', 'newspack-plugin' ) }
				</Button>
			</div>
		</Modal>
	);
}
