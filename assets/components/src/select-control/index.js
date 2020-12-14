/**
 * Select Control
 */

/**
 * WordPress dependencies
 */
import { SelectControl as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

class SelectControl extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		const classes = classNames( 'newspack-select-control', className );
		return (
			<div className={ classes }>
				<BaseComponent { ...otherProps } />
			</div>
		);
	}
}

export default SelectControl;
