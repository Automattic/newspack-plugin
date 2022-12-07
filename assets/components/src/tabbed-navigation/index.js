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

const TabbedNavigation = ( { items, className, disableUpcoming, children = null } ) => {
	const { location } = useHistory();
	const currentIndex = findIndex( items, [ 'path', location.pathname ] );
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
			{ children }
		</div>
	);
};

export default TabbedNavigation;
