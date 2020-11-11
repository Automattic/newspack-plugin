/**
 * Tabbed Navigation
 */

/**
 * External dependencies.
 */
import classNames from 'classnames';
import Router from '../proxied-imports/router';

/**
 * Internal dependencies.
 */
import './style.scss';

const { NavLink, useHistory } = Router;

/**
 * Tabbed navigation.
 */
const TabbedNavigation = ( { items, className } ) => {
	const classes = classNames( 'newspack-tabbed-navigation', className );
	const {
		location: { pathname },
	} = useHistory();
	return (
		<div className={ classes }>
			<ul>
				{ items.map( ( item, key ) => (
					<li key={ key }>
						<NavLink
							to={ item.path }
							exact={ item.exact }
							className={ classNames( {
								selected:
									item.path === '/' ? pathname === item.path : pathname.indexOf( item.path ) === 0,
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
