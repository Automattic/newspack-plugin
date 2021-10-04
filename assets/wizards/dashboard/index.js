/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
			{ newspack_aux_data.is_debug_mode && (
				<Notice
					isWarning
					className="newspack-wizard__above-header"
					noticeText={ __( 'Newspack is in debug mode.', 'newspack' ) }
				/>
			) }
			<div className="newspack-wizard__header">
				<div className="newspack-wizard__header__inner">
					<div className="newspack-wizard__title">
						<NewspackIcon size={ 36 } />
						<h1>{ __( 'Dashboard', 'newspack' ) }</h1>
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
