/**
 * Checklist for tracking multi-step tasks.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Children, cloneElement } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import murielClassnames from '../../shared/js/muriel-classnames';
import Button from '../button';
import ProgressBar from '../progressBar';
import './style.scss';

class Checklist extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hideCompleted: false,
		};
	}

	/**
	 * Render.
	 */
	render() {
		const { className, children, currentTask, progressBarText, ...otherProps } = this.props;
		const { hideCompleted } = this.state;
		const completedLabel = hideCompleted ? __( 'Show completed' ) : __( 'Hide completed' );
		const completedIcon = hideCompleted ? 'arrow-down-alt2' : 'arrow-up-alt2';
		const classes = murielClassnames(
			'muriel-checklist',
			className,
			hideCompleted && 'is-hide-completed'
		);
		const shouldShowHideCompletionUI = currentTask > 0;
		return (
			<div className={ classes } { ...otherProps }>
				<div className="muriel-checklist__header">
					<div className="muriel-checklist__header-main">
						<ProgressBar
							completed={ currentTask }
							total={ Children.count( children ) }
							displayFraction
							label={ progressBarText }
						/>
					</div>
					{ shouldShowHideCompletionUI && (
						<div className="muriel-checklist__header-secondary">
							<label htmlFor="muriel-checklist__header-action">{ completedLabel }</label>
							<Button
								id="muriel-checklist__header-action"
								onClick={ () => this.setState( { hideCompleted: ! hideCompleted } ) }
							>
								<Dashicon icon={ completedIcon } />
							</Button>
						</div>
					) }
				</div>
				<div className="muriel-checklist__tasks">
					{ Children.map( children, ( child, index ) => {
						return cloneElement( child, {
							current: index === currentTask,
							complete: index < currentTask,
						} );
					} ) }
				</div>
			</div>
		);
	}
}

export default Checklist;
