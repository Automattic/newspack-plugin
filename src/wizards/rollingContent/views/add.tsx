/**
 * Rolling Content — Add view (placeholder).
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WizardSection from '../../wizards-section';

export default function Add() {
	return (
		<>
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 16,
				} }
			>
				<h2 style={ { margin: 0 } }>{ __( 'Add Rolling Content', 'newspack-plugin' ) }</h2>
				<Button variant="secondary" href="admin.php?page=newspack-rolling-content">
					{ __( 'Back to All Rolling Content', 'newspack-plugin' ) }
				</Button>
			</div>
			<WizardSection
				title={ __( 'Add Rolling Content', 'newspack-plugin' ) }
				description={ __(
					'This is where the block editor would open to create a new Rolling Content. For this demo, no editor is wired up.',
					'newspack-plugin'
				) }
			>
				<></>
			</WizardSection>
		</>
	);
}
