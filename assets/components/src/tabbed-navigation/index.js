/**
 * WordPress dependencies.
 */
import { useEffect } from '@wordpress/element';

/**
 * External dependencies.
 */
import classnames from 'classnames';
import { findIndex } from 'lodash';
import Router from '../proxied-imports/router';

/**
 * Internal dependencies.
 */
import './style.scss';

const { NavLink, useHistory } = Router;

const TabbedNavigation = ( { items, className, disableUpcoming } ) => {
	const { location } = useHistory();
	const currentIndex = findIndex( items, [ 'path', location.pathname ] );

	useEffect( () => {
		const header = document.querySelector( '.newspack-wizard__header' );
		const navigation = document.querySelector( '.newspack-tabbed-navigation' );
		const content = document.querySelector( '.newspack-wizard__content' );
		const notice = document.querySelector( '.newspack-wizard__above-header' );

		/**
		 * Toggle an "is-fixed" class to the TabbedNavigation.
		 */
		function fixedNavigation() {
			window.addEventListener( 'scroll', function () {
				const navigationHeight = navigation.offsetHeight + 32;
				let scrollHeight = header.offsetHeight;

				if ( notice ) {
					scrollHeight += notice.offsetHeight;
				}

				if ( window.scrollY > scrollHeight ) {
					navigation.classList.add( 'is-fixed' );
					content.style.paddingTop = navigationHeight + 'px';
				} else {
					navigation.classList.remove( 'is-fixed' );
					content.removeAttribute( 'style' );
				}
			} );
		}

		window.addEventListener( 'resize', fixedNavigation(), true );
	} );

	return (
		<div className={ classnames( 'newspack-tabbed-navigation', className ) }>
			<ul>
				{ items.map( ( item, index ) => (
					<li key={ index }>
						<NavLink
							to={ item.path }
							exact
							activeClassName={ 'selected' }
							className={ classnames( {
								disabled: disableUpcoming && index > currentIndex,
							} ) }
						>
							{ item.label }
						</NavLink>
					</li>
				) ) }
			</ul>
		</div>
	);
};

export default TabbedNavigation;
