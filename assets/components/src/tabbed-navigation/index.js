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
import { Handoff } from '../';
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
	// eslint-disable-next-line no-unused-vars
	const [ _, firstPathPart ] = pathname.split( '/' );
	return (
		<div className={ classes }>
			<ul>
				{ items.map( ( item, key ) => (
					<li key={ key }>
						{ item.handoff ? (
							<Handoff
								className="newspack-tabbed-navigation__handoff"
								plugin={ item.handoff }
								editLink={ item.editLink }
								noStatus
								isLink
							>
								{ item.label }
							</Handoff>
						) : (
							<NavLink
								to={ item.path }
								exact={ item.exact }
								className={ classNames( {
									selected:
										item.path === '/'
											? pathname === item.path
											: firstPathPart === item.path.replace( /\//g, '' ),
								} ) }
							>
								{ item.label }
							</NavLink>
						) }
					</li>
				) ) }
			</ul>
		</div>
	);
};

export default TabbedNavigation;
