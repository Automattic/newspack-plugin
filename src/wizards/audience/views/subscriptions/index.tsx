/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Wizard, withWizard } from '../../../../components/src';

function AudienceSubscriptions() {
	const tabs = [
		{
			label: __( 'Configuration', 'newspack-plugin' ),
			path: '/configuration',
			render: () => <>Configuration!</>,
		},
		{
			label: __( 'Revenue', 'newspack-plugin' ),
			path: '/revenue',
			render: () => <>Revenue!</>,
		},
		{
			label: __( 'Settings', 'newspack-plugin' ),
			path: '/settings',
			render: () => <>Settings!</>,
		},
	];
	return (
		<Wizard
			headerText={ __(
				'Audience Development / Subscriptions',
				'newspack-plugin'
			) }
			sections={ tabs }
			requiredPlugins={ [ 'woocommerce', 'woocommerce-memberships' ] }
		/>
	);
}

export default withWizard( AudienceSubscriptions );
