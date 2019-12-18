/**
 * Action Card
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { Button, Card, Handoff, Notice, ToggleControl, Waiting } from '../';

/**
 * Internal dependencies
 */
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
	 * Render
	 */
	render( props ) {
		const {
			badge,
			className,
			title,
			description,
			handoff,
			editLink,
			href,
			notification,
			notificationLevel,
			actionText,
			secondaryActionText,
			image,
			imageLink,
			simple,
			onClick,
			onSecondaryActionClick,
			isWaiting,
			toggleChecked,
			toggleOnChange,
		} = this.props;
		const classes = classnames(
			'newspack-action-card',
			simple && 'newspack-card__is-clickable',
			className
		);
		const hasSecondaryAction = secondaryActionText && onSecondaryActionClick;
		const actionDisplay = ( simple && <Dashicon icon="arrow-right-alt2" /> ) || actionText;
		return (
			<Card className={ classes } onClick={ simple && onClick }>
				<div className="newspack-action-card__region newspack-action-card__region-top">
					{ toggleOnChange && (
						<ToggleControl checked={ toggleChecked } onChange={ toggleOnChange } />
					) }
					{ image && ! toggleOnChange && (
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
						<h2>
							<span className="newspack-action-card__title">{ title }</span>
							{ badge && <span className="newspack-action-card__badge">{ badge }</span> }
						</h2>
						<p>{ description }</p>
					</div>
					{ actionDisplay && (
						<div className="newspack-action-card__region newspack-action-card__region-right">
							{ handoff && (
								<Handoff plugin={ handoff } editLink={ editLink } compact isLink>
									{ actionDisplay }
								</Handoff>
							) }
							{ ( !! onClick || !! href ) && ! handoff && (
								<Button
									isLink
									href={ href }
									onClick={ onClick }
									className="newspack-action-card__primary_button"
								>
									{ actionDisplay }
								</Button>
							) }
							{ ! handoff && ! onClick && ! href && (
								<div className="newspack-action-card__container">
									{ actionDisplay }
									{ isWaiting && <Waiting isRight /> }
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
					<div className="newspack-action-card__notification">
						{ 'error'   === notificationLevel && ( <Notice noticeText={ notification } isError /> ) }
						{ 'info'    === notificationLevel && ( <Notice noticeText={ notification } isPrimary /> ) }
						{ 'success' === notificationLevel && ( <Notice noticeText={ notification } isSuccess /> ) }
						{ 'warning' === notificationLevel && ( <Notice noticeText={ notification } isWarning /> ) }
					</div>
				) }
			</Card>
		);
	}
}

ActionCard.defaultProps = {
	toggleChecked: false,
};

export default ActionCard;
