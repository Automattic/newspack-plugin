/**
 * A single checklist task row.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import Button from '../button';
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
			completedTitle,
			description,
			onClick,
			onDismiss,
			title,
		} = this.props;
		const classes = classnames( 'muriel-task', active && 'is-active', completed && 'is-completed' );
		return (
			<div className={ classes }>
				<div className="checklist__task-icon">{ completed && <Dashicon icon="yes" /> }</div>
				{ completed && (
					<div className="checklist__task-primary">
						<h1>{ completedTitle }</h1>
					</div>
				) }
				{ ! completed && (
					<div className="checklist__task-primary">
						<h1>{ title }</h1>
						<h2>{ description }</h2>
					</div>
				) }
				<div className="checklist__task-secondary">
					{ active && (
						<Fragment>
							{ onClick && (
								<Button isPrimary onClick={ onClick }>
									{ buttonText }
								</Button>
							) }
							{ onDismiss && (
								<Button isLink onClick={ onDismiss }>
									{ __( 'Skip' ) }
								</Button>
							) }
						</Fragment>
					) }
					{ completed && (
						<Button isLink onClick={ onClick }>
							{ __( 'Edit' ) }
						</Button>
					) }
				</div>
			</div>
		);
	}
}

export default Task;
