/**
 * Image uploader component.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { data } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import './style.scss';

/**
 * Image select/upload button and modal.
 */
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
		const { image } = this.props;

		return (
			<Fragment>
				{ !! image && (
				<div className="newspack-image-upload has-image">
					<div className="image-preview">
						<img src={ image.url } />
					</div>
					<Button className="remove-image" onClick={ this.removeImage }>
						{ __( 'Remove image' ) }
					</Button>
				</div>
				) }
				{ ! image && (
					<div className="newspack-image-upload no-image">
						<Button className="add-image" onClick={ this.openModal }>
							{ __( 'Add an image' ) }
						</Button>
					</div>
				) }
			</Fragment>
		);
	}
}
export default ImageUpload;
