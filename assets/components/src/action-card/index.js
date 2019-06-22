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
import murielClassnames from '../../../shared/js/muriel-classnames';
import './style.scss';

/**
 * External dependencies
 */

import classnames from 'classnames';

class ActionCard extends Component {
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
			href,
			notification,
			notificationLevel,
			actionText,
			secondaryActionText,
			image,
			imageLink,
			onClick,
			onSecondaryActionClick,
			isWaiting,
		} = this.props;
		const classes = murielClassnames( 'newspack-action-card', className );
		const notificationClasses = classnames(
			'newspack-action-card__notification',
			'notice',
			`notice-${ notificationLevel }`,
			'notice-alt',
			'update-message'
		);
		const hasSecondaryAction = secondaryActionText && onSecondaryActionClick;
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
						<div className="newspack-action-card__region newspack-action-card__region-right">
							{ actionText && ( !! onClick || !! href ) && (
								<Button isLink href={ href } onClick={ onClick } className="newspack-action-card__primary_button">
									{ actionText }
								</Button>
							) }

							{ actionText && ( ! onClick && ! href ) && (
								<div className="newspack-action-card__container">
									{ isWaiting && <Spinner /> }
									{ actionText }
								</div>
							) }

							{ secondaryActionText && onSecondaryActionClick && (
								<Button
									isLink
									onClick={ onSecondaryActionClick }
									className="newspack-action-card__secondary_button"
								>
									{ secondaryActionText }
								</Button>
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
