/**
 * Toggle group
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { ToggleControl } from '@wordpress/components';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

/**
 * Progress bar.
 */
class ToggleGroup extends Component {
	/**
	 * Render.
	 */
	render() {
		const { checked, children, description, onChange, title, className } = this.props;
		const classes = murielClassnames( 'muriel-toggle-group', className );
		return (
			<div className={ classes }>
				<ToggleControl checked={ checked } onChange={ onChange } />
				<div className="container">
					<h1>{ title }</h1>
					<h2>{ description }</h2>
					{ checked && children }
				</div>
			</div>
		);
	}
}

export default ToggleGroup;
