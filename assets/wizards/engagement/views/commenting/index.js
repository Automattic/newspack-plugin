/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

const Commenting = () => {
	return (
		<>
			<ActionCard
				title={ __( 'WordPress Commenting' ) }
				description={ __( 'Native WordPress commenting system.' ) }
				actionText={ __( 'Configure' ) }
				handoff="wordpress-settings-discussion"
			/>
		</>
	);
};

export default withWizardScreen( Commenting );
