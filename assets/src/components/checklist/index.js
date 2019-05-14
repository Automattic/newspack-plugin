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
import murielClassnames from '../../shared/js/muriel-classnames';
import ProgressBar from '../progressBar';
import './style.scss';

class Checklist extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, children, currentTask, progressBarText, ...otherProps } = this.props;
		return (
			<div className={ murielClassnames( 'muriel-checklist', className ) } { ...otherProps }>
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
