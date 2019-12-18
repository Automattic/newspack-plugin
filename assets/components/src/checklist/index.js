/**
 * Checklist
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Component, Children, cloneElement } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { Button, Card, ProgressBar } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

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
		const iconExpandLess = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
			</SVG>
		);
		const iconExpandMore = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
			</SVG>
		);
		const completedLabel = hideCompleted ? __( 'Show completed' ) : __( 'Hide completed' );
		const completedIcon = hideCompleted ? iconExpandMore : iconExpandLess;
		const classes = classnames(
			'newspack-checklist',
			className,
			hideCompleted && 'is-hide-completed'
		);
		const completedCount = Children.toArray( children ).reduce( ( completedCount, child ) => {
			return completedCount + ( child.props.completed ? 1 : 0 );
		}, 0 );
		return (
			<Card className={ classes } { ...otherProps }>
				<div className="newspack-checklist__wrapper">
					<div className="newspack-checklist__header">
						<div className="newspack-checklist__progress-bar">
							<ProgressBar
								completed={ completedCount }
								total={ Children.count( children ) }
								displayFraction
								label={ progressBarText }
							/>
						</div>
						<div className="newspack-checklist__header-action">
							<label htmlFor="newspack-checklist__header-action">{ completedLabel }</label>
							<Button
								id="newspack-checklist__header-action"
								onClick={ () => this.setState( { hideCompleted: ! hideCompleted } ) }
							>
								{ completedIcon }
							</Button>
						</div>
					</div>
					<div className="newspack-checklist__tasks">{ children }</div>
				</div>
			</Card>
		);
	}
}

export default Checklist;
