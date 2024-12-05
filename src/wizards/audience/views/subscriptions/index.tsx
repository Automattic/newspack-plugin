/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Wizard, withWizard } from '../../../../components/src';
import Configuration from './configuration';
import Revenue from './revenue';

function AudienceSubscriptions() {
	const tabs = [
		{
			label: __( 'Configuration', 'newspack-plugin' ),
			path: '/configuration',
			render: () => <Configuration />,
		},
		{
			label: __( 'Revenue', 'newspack-plugin' ),
			path: '/revenue',
			render: () => <Revenue />,
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
