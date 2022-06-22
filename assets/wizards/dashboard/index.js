/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { GlobalNotices, Footer, Grid, NewspackIcon, Notice } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

const Dashboard = ( { items } ) => {
	return (
		<Fragment>
			<GlobalNotices />
			{ newspack_aux_data.is_debug_mode && <Notice debugMode /> }
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<div className="newspack-wizard__title">
						<NewspackIcon size={ 36 } />
					</div>
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
