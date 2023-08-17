/**
 * External dependencies.
 */
import classnames from 'classnames';
import findIndex from 'lodash/findIndex';
import Router from '../proxied-imports/router';

/**
 * Internal dependencies.
 */
import './style.scss';

const { NavLink, useHistory } = Router;

const TabbedNavigation = ( { items, className, disableUpcoming, children = null } ) => {
	const displayedItems = items.filter( item => ! item.isHiddenInTabbedNavigation );
	const { location } = useHistory();
	const currentIndex = findIndex( displayedItems, [ 'path', location.pathname ] );
	return (
		<div className={ classnames( 'newspack-tabbed-navigation', className ) }>
			<ul>
				{ displayedItems.map( ( item, index ) => (
					<li key={ index }>
						<NavLink
							to={ item.path }
							isActive={ ( match, { pathname } ) => {
								if ( item.activeTabPaths ) {
									return item.activeTabPaths.includes( pathname );
								}
								return match;
							} }
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
			{ children }
		</div>
	);
};

export default TabbedNavigation;
