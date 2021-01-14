/**
 * Style Card
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, WebPreview } from '../';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class StyleCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, cardTitle, url, image, isActive, onClick, id } = this.props;
		const classes = classnames(
			'newspack-style-card',
			isActive && 'newspack-style-card__is-active',
			className
		);
		return (
			<div className={ classes } tabIndex={ isActive ? -1 : 0 } id={ id }>
				<div className="newspack-style-card__image">
					{ image && <img src={ image } alt={ cardTitle + ' - ' + __( 'Thumbnail' ) } /> }
					{ ! isActive && (
						<div className="newspack-style-card__actions">
							<Button isLink onClick={ onClick } aria-label={ __( 'Activate' ) + ' ' + cardTitle }>
								{ __( 'Activate' ) }
							</Button>
							{ url && <WebPreview url={ url } label={ __( 'View Demo' ) } isLink /> }
						</div>
					) }
				</div>
				<div className="newspack-style-card__title">{ cardTitle }</div>
			</div>
		);
	}
}

export default StyleCard;
