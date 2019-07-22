/**
 * Tabbed Navigation
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import murielClassnames from '../../../shared/js/muriel-classnames';

/**
 * External dependencies.
 */
import classnames from 'classnames';
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
		const classes = murielClassnames( 'muriel-tabbed-navigation', 'muriel-grid-item', className );
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
