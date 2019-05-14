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
	constructor() {
		super( ...arguments );
		this.state = {
			editing: false,
		}
	}

	/**
	 * Render.
	 */
	render() {
		const {
			buttonText,
			completedTitle,
			description,
			current,
			complete,
			onClick,
			onSkip,
			title
		} = this.props;
		const { editing } = this.state;
		const isActive = editing || current;
		const isComplete = ! editing && complete;
		const classes = classnames(
			"muriel-task",
			isActive && 'is-active',
			isComplete && 'is-complete'
		);
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
					{ isActive && (
						<Fragment>
							{ onClick && <Button isPrimary onClick={ e => this.setState( { editing: false }, onClick ) }>{ buttonText }</Button> }
							{ onSkip && <Button isLink onClick={ e => this.setState( { editing: false }, onSkip ) }>{ __( 'Skip' ) }</Button> }
						</Fragment>
					) }
					{ isComplete && (
						<Button isLink onClick={ () => this.setState( { editing: true } ) }>{ __( 'Edit' ) }</Button>
					) }
				</div>
			</div>
		);
	}
}

export default Task;
