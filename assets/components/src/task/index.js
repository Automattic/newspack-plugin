/**
 * Task
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { Card, Button } from '../';
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
		const {
			active,
			buttonText,
			completed,
			description,
			onClick,
			onDismiss,
			title,
		} = this.props;
		const classes = classnames(
			'newspack-task',
			active && 'is-active',
			completed && 'is-completed'
		);
		const iconDone = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</SVG>
		);
		return (
			<Card className={ classes }>
				<div className="newspack-task__task-icon">{ completed && iconDone }</div>
				<div className="newspack-task__task-description">
					<p className="is-dark"><strong>{ title }</strong></p>
					{ ! completed && ( <p>{ description }</p> ) }
					{ completed && (
						<Button isLink onClick={ onClick }>
							{ __( 'Edit' ) }
						</Button>
					) }
				</div>
				<div className="newspack-task__task-buttons">
					{ active && (
						<Fragment>
							{ onClick && (
								<Button isPrimary onClick={ onClick }>
									{ buttonText }
								</Button>
							) }
							{ onDismiss && (
								<Button isDefault onClick={ onDismiss }>
									{ __( 'Skip' ) }
								</Button>
							) }
						</Fragment>
					) }
				</div>
			</Card>
		);
	}
}

export default Task;
