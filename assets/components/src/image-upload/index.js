/**
 * Image Upload
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, InfoButton } from '../';
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
			frame: false,
		};
	}

	/**
	 * Open the WP media modal.
	 */
	openModal = () => {
		if ( this.state.frame ) {
			this.state.frame.open();
			return;
		}

		this.setState(
			{
				frame: wp.media( {
					title: __( 'Select or upload image' ),
					button: {
						text: __( 'Select' ),
					},
					library: {
						type: 'image',
					},
					multiple: false,
				} ),
			},
			() => {
				this.state.frame.on( 'select', this.handleImageSelect );
				this.state.frame.open();
			}
		);
	};

	/**
	 * Update the state when an image is selected from the media modal.
	 */
	handleImageSelect = () => {
		const { onChange } = this.props;
		const attachment = this.state.frame
			.state()
			.get( 'selection' )
			.first()
			.toJSON();
		onChange( attachment );
	};

	/**
	 * Render.
	 */
	render = () => {
		const { onChange, className, label, info, image, style = {} } = this.props;
		const classes = classnames(
			'newspack-image-upload__image',
			{ 'newspack-image-upload__image--has-image': image },
			className
		);
		return (
			<div className="newspack-image-upload">
				<div className="newspack-image-upload__header">
					{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
					{ label && <label className="newspack-image-upload__label">{ label }</label> }
					{ info && <InfoButton text={ info } /> }
				</div>
				<div
					className={ classes }
					style={ { ...( image ? { backgroundImage: `url('${ image.url }')` } : {} ), ...style } }
				>
					{ image ? (
						<div>
							<Button
								onClick={ () => {
									onChange( null );
									this.openModal();
								} }
								isLink
							>
								{ __( 'Replace' ) }
							</Button>
							<br />
							<Button onClick={ () => onChange( null ) } isLink isDestructive>
								{ __( 'Remove' ) }
							</Button>
						</div>
					) : (
						<Button onClick={ this.openModal } isLink>
							{ __( 'Add image' ) }
						</Button>
					) }
				</div>
			</div>
		);
	};
}
export default ImageUpload;
