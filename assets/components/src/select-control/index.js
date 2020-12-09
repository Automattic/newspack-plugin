/**
 * Select Control
 */

/**
 * WordPress dependencies
 */
import { SelectControl as BaseComponent } from '@wordpress/components';
import { Component } from '@wordpress/element';

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
		return (
			<div className={ 'newspack-select-control' }>
				<BaseComponent className={ className } { ...otherProps } />
			</div>
		);
	}
}

export default SelectControl;
