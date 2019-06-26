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
					className='newspack_dashboard__header'
					headerText={ __( 'Newspack' ) }
					subHeaderText={ __(
						"Here we'll guide you through the steps necessary to get your news site ready for launch"
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
