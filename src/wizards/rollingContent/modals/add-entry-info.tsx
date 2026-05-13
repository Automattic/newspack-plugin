/**
 * Rolling Content demo — Add Entry info modal.
 *
 * Explains the implicit parent association: in a real implementation,
 * choosing "Add New Entry" from a Rolling Content row (or from inside the
 * Manage Entries modal) would open the block editor with the chosen
 * Rolling Content preselected as the parent.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';

export default function AddEntryInfoModal( { parentTitle, onClose }: { parentTitle: string; onClose: () => void } ) {
	return (
		<Modal title={ __( 'Add new entry', 'newspack-plugin' ) } onRequestClose={ onClose } size="medium">
			<p>
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: parent rolling content title, wrapped in <name/>. */
						__(
							'Selecting "Add New Entry" would open the post editor with <name>%s</name> preselected as the parent. The link between an entry and its parent is implicit in how you enter the editor — no manual selection required.',
							'newspack-plugin'
						),
						parentTitle
					),
					{ name: <strong /> }
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
