/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { GlobalNotices, Footer, Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

/**
 * Newspack Dashboard.
 */
class Dashboard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;

		return (
			<Fragment>
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						<NewspackLogo />
					</div>
				</div>
				<div className="mw6 mr-auto ml-auto">
					<GlobalNotices />
				</div>
				<div className="newspack-wizard newspack-wizard__content">
					<Grid columns={ 3 } gutter={ 32 }>
						{ items.map( card => (
							<DashboardCard { ...card } key={ card.slug } />
						) ) }
					</Grid>
				</div>
				<Footer />
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
