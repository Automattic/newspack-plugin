/**
 * Image Upload
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { data } from '@wordpress/data';
import { SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

class ImageUpload extends Component {

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			frame    : false,
		}
	}

	/**
	 * Open the WP media modal.
	 */
	openModal = () => {
		if ( this.state.frame ) {
			this.state.frame.open();
			return;
		}

		this.state.frame = wp.media( {
			title: __( 'Select or upload image' ),
			button: {
				text: __( 'Select' )
			},
			library: {
				type: 'image'
			},
			multiple: false
		} );

		this.state.frame.on( 'select', this.handleImageSelect );
		this.state.frame.open();
	}

	/**
	 * Update the state when an image is selected from the media modal.
	 */
	handleImageSelect = () => {
		const { onChange } = this.props;
		const attachment = this.state.frame.state().get( 'selection' ).first().toJSON();
		onChange( attachment );
	}

	/**
	 * Clear the selected image.
	 */
	removeImage = () => {
		const { onChange } = this.props;
		onChange( null );
	}

	/**
	 * Render.
	 */
	render = () => {
		const { className, image } = this.props;
		const iconAddImage = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/>
			</SVG>
		);
		const iconRemoveImage = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
			</SVG>
		);
		return (
			<Fragment>
				{ !! image && (
				<div className={ classnames( 'newspack-image-upload', 'newspack-image-upload__has-image', className ) }>
					<div className="newspack-image-upload__image-preview">
						<img src={ image.url } />
					</div>
					<Button onClick={ this.removeImage } isTertiary>
						{ iconRemoveImage }
						{ __( 'Remove image' ) }
					</Button>
				</div>
				) }
				{ ! image && (
					<div className={ classnames( 'newspack-image-upload', className ) }>
						<Button onClick={ this.openModal } isTertiary>
							{ iconAddImage }
							{ __( 'Add an image' ) }
						</Button>
					</div>
				) }
			</Fragment>
		);
	}
}
export default ImageUpload;
