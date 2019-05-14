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
import ProgressBar from '../progressBar';
import './style.scss';

class Checklist extends Component {
	/**
	 * Render.
	 */
	render() {
		const { children, currentTask, progressBarText } = this.props;
		return (
			<div className="muriel-checklist">
				<div className="muriel-checklist__progress-bar">
					<ProgressBar completed={ currentTask } total={ Children.count( children ) } displayFraction label={ progressBarText } />
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
