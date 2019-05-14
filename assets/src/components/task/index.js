/**
 * Checklist for tracking multi-step tasks.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button, Dashicon } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class Task extends Component {
	/**
	 * Render.
	 */
	render() {
		const { buttonText, completedTitle, description, isCurrent, isComplete, onClick, title } = this.props;
		const classes = classnames( "muriel-task", isCurrent ? 'is-current' : null, isComplete ? 'is-complete' : null );
		return (
			<div className={ classes }>
				<div className="checklist__task-icon">
					{ isComplete && <Dashicon icon="yes" /> }
				</div>
				{ isComplete && (
				<div className="checklist__task-primary">
					<h1>{ completedTitle }</h1>
				</div>
				) }
				{ ! isComplete && (
				<div className="checklist__task-primary">
					<h1>{ title }</h1>
					<h2>{ description }</h2>
				</div>
				) }
				<div className="checklist__task-secondary">
					{ isCurrent && <Button isPrimary onClick={ onClick }>{ buttonText }</Button> }
				</div>
			</div>
		);
	}
}

export default Task;
