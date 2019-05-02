import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { data } from '@wordpress/data';

/**
 * Image select/upload button and modal.
 */
class ImageUpload extends Component {

	/**
	 * Constructor.
	 */
	constructor( props ) {
		super( props );
		this.state = {
			frame    : false,
			image_id : props.image_id || 0,
			image_url: props.image_url || '',
		}

		this.openModal          = this.openModal.bind( this );
		this.handleImageSelect  = this.handleImageSelect.bind( this );
		this.removeImage        = this.removeImage.bind( this );
		this.renderImagePreview = this.renderImagePreview.bind( this );
	}

	/**
	 * Fake an onChange event when this gets updated, so components can listen in.
	 */
	componentDidUpdate() {
		if ( 'onChange' in this.props ) {
			this.props.onChange( this.state );
		}
	}

	/**
	 * Open the WP media modal.
	 */
	openModal( evt ) {
		evt.preventDefault();

		if ( this.state.frame ) {
			this.state.frame.open();
			return;
		}

		this.state.frame = wp.media( {
			title: 'Select or upload image',
			button: {
				text: 'Select'
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
	handleImageSelect() {
		let attachment = this.state.frame.state().get( 'selection' ).first().toJSON();
		this.setState( {
			image_id: attachment.id,
			image_url: attachment.url
		} );
	}

	/**
	 * Clear the selected image.
	 */
	removeImage() {
		this.setState( {
			image_id: 0,
			image_url: ''
		} );
	}

	/**
	 * Render when an image has been uploaded.
	 */
	renderImagePreview() {
		return (
			<div className="newspack-image-upload has-image">
				<div className="image-preview">
					<img src={ this.state.image_url } />
				</div>
				<Button className="remove-image" onClick={ this.removeImage }>
					Remove image
				</Button>
			</div>
		);
	}

	/**
	 * Render.
	 */
	render() {
		if ( this.state.image_id ) {
			return this.renderImagePreview();
		}

		return (
			<div className="newspack-image-upload no-image">
				<Button className="add-image" onClick={ this.openModal }>
					Add an image
				</Button>
			</div>
		);
	}
}
export default ImageUpload;
