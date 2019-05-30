/**
 * Action cards.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { Button, Card } from '../';

/**
 * Internal dependencies
 */
import murielClassnames from '../../shared/js/muriel-classnames';
import './style.scss';

/**
 * External dependencies
 */

import classnames from 'classnames';

class ActionCard extends Component {
	actionTypeFromProps = props => {
		const { isButton, isSpinner } = props;
		if ( isButton ) {
			return 'button';
		}
		if ( isSpinner ) {
			return 'spinner';
		}
		return 'none';
	};

	backgroundImageStyles = url => {
		return url ? { backgroundImage: `url(${ url })` } : {};
	};

	/**
	 * Render.
	 */
	render( props ) {
		const {
			className,
			title,
			description,
			notification,
			notificationLevel,
			actionText,
			secondaryActionText,
			image,
			imageLink,
			onClick,
			onSecondaryActionClick,
		} = this.props;
		const classes = murielClassnames( 'newspack-action-card', className );
		const notificationClasses = classnames(
			'newspack-action-card__notification',
			'notice',
			`notice-${ notificationLevel }`,
			'notice-alt',
			'update-message',
		);
		const actionType = this.actionTypeFromProps( this.props );
		return (
			<Card className={ classes }>
				<div className="newspack-action-card__region newspack-action-card__region-top">
					{ image && (
						<div className="newspack-action-card__region newspack-action-card__region-left">
							<a href={ imageLink }>
								<div
									className="newspack-action-card__image"
									style={ this.backgroundImageStyles( image ) }
								/>
							</a>
						</div>
					) }
					<div className="newspack-action-card__region newspack-action-card__region-center">
						<h1>{ title }</h1>
						<h2>{ description }</h2>
					</div>
					{ actionText && (
						<div
							className={ classnames(
								'newspack-action-card__region',
								'newspack-action-card__region-right',
								'button' === actionType &&
									secondaryActionText &&
									'newspack-action-card__region-right__double-button'
							) }
						>
							{ 'button' === actionType && (
								<Button isLink onClick={ onClick } className="newspack-action-card__primary_button">
									{ actionText }
								</Button>
							) }
							{ 'button' === actionType && secondaryActionText && (
								<Button
									isLink
									onClick={ onSecondaryActionClick }
									className="newspack-action-card__secondary_button"
								>
									{ secondaryActionText }
								</Button>
							) }
							{ 'spinner' === actionType && (
								<div className="newspack-action-card__action-type__spinner">
									<Spinner />
									{ actionText }
								</div>
							) }
							{ 'none' === actionType && (
								<p className="newspack-action-card__action-type__none">{ actionText }</p>
							) }
						</div>
					) }
				</div>
				{ notification && (
					<div className={ notificationClasses }>
						<p>{ notification }</p>
					</div>
				) }
			</Card>
		);
	}
}

export default ActionCard;
