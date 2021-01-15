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
			<div className={ classes } id={ id }>
				<div className="newspack-style-card__image">
					{ image && (
						<img src={ image } alt={ cardTitle + ' - ' + __( 'Thumbnail', 'newspack' ) } />
					) }
					{ ! isActive && (
						<div className="newspack-style-card__actions">
							<Button
								isLink
								onClick={ onClick }
								aria-label={ __( 'Activate', 'newspack' ) + ' ' + cardTitle }
								tabindex="0"
							>
								{ __( 'Activate', 'newspack' ) }
							</Button>
							{ url && <WebPreview url={ url } label={ __( 'View Demo', 'newspack' ) } isLink /> }
						</div>
					) }
				</div>
				<div
					className="newspack-style-card__title"
					title={ isActive && __( 'Active theme', 'newspack' ) }
				>
					{ cardTitle }
				</div>
			</div>
		);
	}
}

export default StyleCard;
