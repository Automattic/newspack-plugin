/**
 * Wizard Pagination
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button } from '../';
import Router from '../proxied-imports/router';
import './style.scss';

const { withRouter } = Router;

const WizardPagination = props => {
	const [ showSteps, setShowSteps ] = useState( false );
	const stepper = useRef( null );
	const { history, location, routes } = props;
	if ( ! routes || ! history || ! location ) {
		return;
	}

	const routeList = Object.keys( routes );
	const currentRoute = routeList.find( route => location.pathname === routes[ route ].path );
	const hideSteps = e => {
		// If clicking outside the expanded stepper, hide it.
		if (
			stepper.current &&
			e.target !== stepper.current &&
			! e.target.classList.contains( 'newspack-wizard-pagination__show-steps' )
		) {
			setShowSteps( false );
		}
	};

	useEffect( () => {
		window.addEventListener( 'click', hideSteps );
		return () => window.removeEventListener( 'click', hideSteps );
	}, [] );

	useEffect( () => {
		setShowSteps( false );
	}, currentRoute );

	return (
		<Fragment>
			<div className="newspack-wizard-pagination newspack-wizard__header__inner">
				{ routeList.length && (
					<>
						<Button
							className="newspack-wizard-pagination__show-steps"
							onClick={ () => setShowSteps( ! showSteps ) }
						>
							{ routes[ currentRoute ].title }
						</Button>
						<ul
							className={ `newspack-wizard-pagination__steps ${
								! showSteps ? 'hidden' : 'newspack-wizard__header__inner'
							}` }
							ref={ stepper }
						>
							{ routeList.map( ( route, index ) => {
								if ( 'welcome' === route ) {
									return null;
								}

								return (
									<>
										<li key={ index } className="newspack-wizard-pagination__step">
											<a
												className={ route === currentRoute ? 'active' : '' }
												href={ '#' + routes[ route ].path }
											>
												{ routes[ route ].title }
											</a>
										</li>
										{ index + 1 < routeList.length && (
											<li className="newspack-wizard-pagination__step separator" />
										) }
									</>
								);
							} ) }
						</ul>
					</>
				) }
			</div>
		</Fragment>
	);
};

export default withRouter( WizardPagination );
