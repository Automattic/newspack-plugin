/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { GlobalNotices, Footer, Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

const Dashboard = ( { items } ) => {
	return (
		<Fragment>
			<GlobalNotices />
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<NewspackLogo centered height={ 72 } />
				</div>
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
};
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
