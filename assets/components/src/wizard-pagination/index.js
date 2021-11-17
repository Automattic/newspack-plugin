/**
 * Wizard Pagination
 */

/**
 * Internal dependencies.
 */
import { ProgressBar } from '../';
import Router from '../proxied-imports/router';
import './style.scss';

const { withRouter } = Router;

const WizardPagination = props => {
	const { location, routes } = props;
	const routeList = Object.keys( routes || {} );
	const currentRoute = routeList.find( route => location.pathname === routes[ route ].path );

	return (
		<div className="newspack-wizard-pagination">
			{ routeList.length && (
				<>
					<ul>
						{ routeList.map( ( route, index ) => {
							if ( '0' === route ) {
								return null;
							}

							const currentIndex = routeList.indexOf( currentRoute );
							const classes = [];

							if ( route === currentRoute ) {
								classes.push( 'active' );
							}

							if ( index > currentIndex ) {
								classes.push( 'disabled' );
							}

							if ( index < currentIndex ) {
								classes.push( 'complete' );
							}

							return (
								<li key={ index }>
									<a
										className={ classes.join( ' ' ) }
										href={ index <= currentIndex && '#' + routes[ route ].path }
									>
										{ routes[ route ].label }
									</a>
								</li>
							);
						} ) }
					</ul>
					<ProgressBar total={ routeList.length } completed={ currentRoute } />
				</>
			) }
		</div>
	);
};

export default withRouter( WizardPagination );
