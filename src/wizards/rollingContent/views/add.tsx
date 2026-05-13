/**
 * Rolling Content — Add view (placeholder).
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../../../packages/components/src/wizard/store';
import WizardSection from '../../wizards-section';

export default function Add() {
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	useEffect( () => {
		setHeaderData( {
			sectionName: __( 'Add Rolling Content', 'newspack-plugin' ),
			actions: [
				{
					type: 'secondary',
					label: __( 'Back to All Rolling Content', 'newspack-plugin' ),
					href: 'admin.php?page=newspack-rolling-content',
				},
			],
		} );
	}, [ setHeaderData ] );

	return (
		<WizardSection
			title={ __( 'Add Rolling Content', 'newspack-plugin' ) }
			description={ __(
				'This is where the block editor would open to create a new Rolling Content. For this demo, no editor is wired up.',
				'newspack-plugin'
			) }
		>
			<></>
		</WizardSection>
	);
}
