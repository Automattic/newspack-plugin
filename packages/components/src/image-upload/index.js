/**
 * Image Upload
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BaseControl } from '@wordpress/components';

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
	static instanceCounter = 0;

	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			frame: false,
		};

		ImageUpload.instanceCounter += 1;
		this.baseControlId = this.props.id || `newspack-image-upload-${ ImageUpload.instanceCounter }`;
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
		const attachment = this.state.frame.state().get( 'selection' ).first().toJSON();
		onChange( attachment );
	};

	/**
	 * Render.
	 */
	render = () => {
		const { buttonLabel, className, disabled, help, image, isCovering, label, onChange, style = {} } = this.props;
		const classes = classnames(
			'newspack-image-upload__image',
			{ 'newspack-image-upload__image--has-image': image },
			{ 'newspack-image-upload__image--covering': isCovering }
		);
		return (
			<BaseControl
				className={ classnames( 'newspack-image-upload', className ) }
				help={ help }
				id={ this.props.id || this.baseControlId }
				label={ label }
			>
				<div className={ classes } style={ { ...style } }>
					{ image?.url ? (
						<>
							<img data-testid="image-upload" src={ image.url } alt={ __( 'Image preview', 'newspack-plugin' ) } />
							<div className="newspack-image-upload__controls">
								<Button disabled={ disabled } onClick={ this.openModal } variant="tertiary">
									{ __( 'Replace', 'newspack-plugin' ) }
								</Button>
								<span className="sep" />
								<Button disabled={ disabled } onClick={ () => onChange( null ) } variant="tertiary" isDestructive>
									{ __( 'Remove', 'newspack-plugin' ) }
								</Button>
							</div>
						</>
					) : (
						<Button
							disabled={ disabled }
							onClick={ this.openModal }
							variant="tertiary"
							style={ { width: 'calc(100% - 2px)', justifyContent: 'center' } }
						>
							{ buttonLabel ? buttonLabel : __( 'Upload', 'newspack-plugin' ) }
						</Button>
					) }
				</div>
			</BaseControl>
		);
	};
}
export default ImageUpload;
