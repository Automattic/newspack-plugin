/**
 * Confirmation modal for enabling an experimental tool.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, Button, Modal } from '../../../../../../packages/components/src';
import type { Tool } from './types';

export default function EnableModal( {
	tool,
	disabled,
	onConfirm,
	onClose,
}: {
	tool: Tool;
	disabled?: boolean;
	onConfirm: () => void;
	onClose: () => void;
} ) {
	return (
		<Modal
			/* translators: %s: tool name. */
			title={ sprintf( __( 'Enable %s?', 'newspack-plugin' ), tool.label ) }
			onRequestClose={ onClose }
		>
			{ /* Both initial tools (Roundup Block, Editorial Assistant) use OpenAI.
			   When non-OpenAI tools are added, make this configurable via a
			   `disclosure` field on the tool registration. */ }
			<p>
				{ __(
					"Your content is sent to OpenAI to generate suggestions, but it is not used to train their models. This tool is in active development. We'll check in after you've had a chance to use it.",
					'newspack-plugin'
				) }
			</p>
			<Card buttonsCard noBorder className="justify-end">
				<Button variant="secondary" onClick={ onClose } disabled={ disabled }>
					{ __( 'Cancel', 'newspack-plugin' ) }
				</Button>
				<Button variant="primary" onClick={ onConfirm } disabled={ disabled }>
					{ __( 'Enable', 'newspack-plugin' ) }
				</Button>
			</Card>
		</Modal>
	);
}
