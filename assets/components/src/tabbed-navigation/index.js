/**
 * Tabbed Navigation
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * External dependencies.
 */
import classNames from 'classnames';
import { NavLink } from 'react-router-dom';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * Progress bar.
 */
class TabbedNavigation extends Component {
	/**
	 * Render.
	 */
	render() {
		const { items, className } = this.props;
		const classes = classNames( 'newspack-tabbed-navigation', className );
		return (
			<div className={ classes }>
				<ul>
					{ items.map( ( item, key ) => (
						<li key={ key }>
							<NavLink to={ item.path } exact={ item.exact } activeClassName="selected">
								{ item.label }
							</NavLink>
						</li>
					) ) }
				</ul>
			</div>
		);
	}
}

export default TabbedNavigation;
