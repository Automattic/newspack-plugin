/**
 * Checklist for tracking multi-step tasks.
 */

/**
 * WordPress dependencies.
 */
import { Component, Children, cloneElement } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';

class Checklist extends Component {
	/**
	 * Render.
	 */
	render() {
		const { children, currentTask } = this.props;
		return (
			<div className="muriel-checklist">
				<div className="muriel-checklist__progress-bar">
					OK
				</div>
				<div className="muriel-checklist__tasks">
					{ Children.map( children, ( child, index ) => {
						const newChild = cloneElement( child, { isCurrent: index === currentTask, isComplete: index < currentTask } );
						return newChild;
					} ) }
				</div>
			</div>
		);
	}
}

export default Checklist;
