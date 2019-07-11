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
import murielClassnames from '../../../shared/js/muriel-classnames';
import { Button, Card, ProgressBar, Grid } from '../';
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
		const { className, children, progressBarText, ...otherProps } = this.props;
		const { hideCompleted } = this.state;
		const completedLabel = hideCompleted ? __( 'Show completed' ) : __( 'Hide completed' );
		const completedIcon = hideCompleted ? 'arrow-down-alt2' : 'arrow-up-alt2';
		const classes = murielClassnames(
			'muriel-checklist',
			className,
			hideCompleted && 'is-hide-completed'
		);
		const completedCount = Children.toArray( children ).reduce( ( completedCount, child ) => {
			return completedCount + ( child.props.completed ? 1 : 0 );
		}, 0 );
		return (
			<Card noBackground className={ classes } { ...otherProps }>
				<div className="muriel-checklist__wrapper">
					<div className="muriel-checklist__header">
						<div className="muriel-checklist__header-main">
							<ProgressBar
								completed={ completedCount }
								total={ Children.count( children ) }
								displayFraction
								label={ progressBarText }
							/>
						</div>
						<div className="muriel-checklist__header-secondary">
							<label htmlFor="muriel-checklist__header-action">{ completedLabel }</label>
							<Button
								id="muriel-checklist__header-action"
								onClick={ () => this.setState( { hideCompleted: ! hideCompleted } ) }
							>
								<Dashicon icon={ completedIcon } />
							</Button>
						</div>
					</div>
					<div className="muriel-checklist__tasks">{ children }</div>
				</div>
			</Card>
		);
	}
}

export default Checklist;
