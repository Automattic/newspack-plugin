import '../../shared/js/public-path';

/**
 * Subscribers Demo — people-first subscriber management prototype.
 *
 * Entry point: mounts a Wizard with two routed sections — the DataViews
 * list (full-width) and the person profile.
 */

/**
 * WordPress dependencies.
 */
import { render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Wizard } from '../../../packages/components/src';
import SubscriberList from './screens/SubscriberList';
import PersonProfile from './screens/PersonProfile';

function SubscribersDemoApp() {
	return (
		<Wizard
			headerText={ __( 'Audience Management / Subscribers', 'newspack-plugin' ) }
			sections={ [
				{
					path: '/',
					exact: true,
					fullWidth: true,
					render: SubscriberList,
				},
				{
					path: '/profile/:id',
					render: PersonProfile,
					isHidden: true,
				},
			] }
		/>
	);
}

render( <SubscribersDemoApp />, document.getElementById( 'newspack-subscribers-demo' ) );
