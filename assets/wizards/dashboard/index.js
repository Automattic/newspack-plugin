import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import ViewStreamIcon from '@material-ui/icons/ViewStream';
import ViewModuleIcon from '@material-ui/icons/ViewModule';

/**
 * Internal dependencies.
 */
import { Button, Card, Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

/**
 * Newspack Dashboard.
 */
class Dashboard extends Component {
	state = {
		view: 'list',
	};

	componentDidMount = () => {
		const view = localStorage.getItem( 'newspack-plugin-dashboard-view' );
		if ( 'list' === view || 'grid' === view ) {
			this.setState( { view } );
		}
	};

	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;
		const { view } = this.state;

		return (
			<Fragment>
				<div className="newspack-logo-wrapper">
					<NewspackLogo />
				</div>
				<Grid className={ 'view-' + view } isWide={ view === 'grid' && true }>
					<Card noBackground className="newspack-dashboard-card__views">
						<Button
							isLink
							onClick={ () =>
								this.setState( { view: 'list' }, () =>
									localStorage.setItem( 'newspack-plugin-dashboard-view', 'list' )
								)
							}
						>
							<ViewStreamIcon />
							<span className="screen-reader-text">{ __( 'List view' ) }</span>
						</Button>
						<Button
							isLink
							onClick={ () =>
								this.setState( { view: 'grid' }, () =>
									localStorage.setItem( 'newspack-plugin-dashboard-view', 'grid' )
								)
							}
						>
							<ViewModuleIcon />
							<span className="screen-reader-text">{ __( 'Grid view' ) }</span>
						</Button>
					</Card>
					{ items.map( card => (
						<DashboardCard { ...card } key={ card.slug } />
					) ) }
				</Grid>
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) ); // eslint-disable-line
