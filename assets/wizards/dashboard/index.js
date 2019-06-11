/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FormattedHeader } from '../../components/src';
import Tier from './views/tier';
import './style.scss';

/**
 * The Newspack dashboard.
 */
class Dashboard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;

		return (
			<Fragment>
				<FormattedHeader
					headerText={ __( 'Welcome to the Newspack Dashboard' ) }
					subHeaderText={ __(
						"Here we'll guide you through the setup and launch of your news site"
					) }
				/>
				{ items.map( ( tier, index ) => (
					<Tier items={ tier } key={ index } />
				) ) }
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
