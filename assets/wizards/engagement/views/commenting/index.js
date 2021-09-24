/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, PluginToggle, withWizardScreen } from '../../../../components/src';

const Commenting = () => {
	return (
		<>
			<ActionCard
				title={ __( 'WordPress Commenting' ) }
				description={ __( 'Native WordPress commenting system.' ) }
				actionText={ __( 'Configure' ) }
				handoff="wordpress-settings-discussion"
			/>
			<PluginToggle
				plugins={ {
					'disqus-comment-system': true,
					'newspack-disqus-amp': true,
					'talk-wp-plugin': true,
				} }
			/>
		</>
	);
};

export default withWizardScreen( Commenting );
